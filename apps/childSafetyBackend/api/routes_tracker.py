from __future__ import annotations

import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from child_safety_core.domain import Location, LocationEvent

router = APIRouter(prefix="/v1", tags=["tracker"])

TrackerMode = Literal["off", "emergency-only", "scheduled", "continuous-guardian"]
PrecisionMode = Literal["high-emergency", "balanced", "coarse-default"]


class TrackerPolicyRequest(BaseModel):
    profileId: str = Field(min_length=1)
    mode: TrackerMode = "emergency-only"
    retentionHours: int = Field(default=24, ge=1, le=24 * 30)
    precisionMode: PrecisionMode = "high-emergency"
    allowAuthorityExport: bool = True
    allowedViewers: list[str] = Field(default_factory=lambda: ["guardian"])


class TrackerPolicyResponse(BaseModel):
    profileId: str
    mode: TrackerMode
    retentionHours: int
    precisionMode: PrecisionMode
    allowAuthorityExport: bool
    allowedViewers: list[str]
    updatedAt: datetime


class TrackerHistoryResponse(BaseModel):
    profileId: str
    viewerRole: str
    eventCount: int
    events: list[LocationEvent]


class TrackerExportRequest(BaseModel):
    requestedBy: str = Field(min_length=1)
    role: str = Field(default="authority")
    scope: str = Field(default="last-24h")
    expiresInMinutes: int = Field(default=60, ge=5, le=24 * 60)


class TrackerExportResponse(BaseModel):
    exportId: str
    profileId: str
    requestedBy: str
    scope: str
    generatedAt: datetime
    expiresAt: datetime
    eventCount: int
    checksum: str
    signature: str


class TrackerExportBundleResponse(BaseModel):
    exportId: str
    profileId: str
    requestedBy: str
    role: str
    scope: str
    generatedAt: datetime
    expiresAt: datetime
    eventCount: int
    checksum: str
    signature: str
    signatureValid: bool
    events: list[dict]


class TrackerAuditEntry(BaseModel):
    id: str
    profileId: str
    action: str
    actor: str
    createdAt: datetime
    metadata: dict[str, str] = Field(default_factory=dict)


class TrackerAuditResponse(BaseModel):
    profileId: str
    count: int
    entries: list[TrackerAuditEntry]


_tracker_events: dict[str, list[LocationEvent]] = {}
_tracker_policies: dict[str, TrackerPolicyResponse] = {}
_tracker_exports: dict[str, dict] = {}
_tracker_audit: dict[str, list[TrackerAuditEntry]] = {}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _sign_payload(value: str) -> str:
    secret = os.getenv("TRACKER_EXPORT_SECRET", "dev-export-secret").encode("utf-8")
    return hmac.new(secret, value.encode("utf-8"), hashlib.sha256).hexdigest()


def _is_export_expired(export_record: dict) -> bool:
    expires_at = export_record.get("expiresAt")
    return bool(expires_at and expires_at <= _now_utc())


def _verify_export_signature(export_record: dict) -> bool:
    expected_signature = _sign_payload(
        f"{export_record['profileId']}:{export_record['exportId']}:{export_record['checksum']}:{export_record['expiresAt'].isoformat()}"
    )
    return hmac.compare_digest(expected_signature, export_record["signature"])


def _record_audit(profile_id: str, action: str, actor: str, metadata: dict[str, str] | None = None) -> None:
    entry = TrackerAuditEntry(
        id=str(uuid.uuid4()),
        profileId=profile_id,
        action=action,
        actor=actor,
        createdAt=_now_utc(),
        metadata=metadata or {},
    )
    _tracker_audit.setdefault(profile_id, []).append(entry)


def _default_policy(profile_id: str) -> TrackerPolicyResponse:
    return TrackerPolicyResponse(
        profileId=profile_id,
        mode="emergency-only",
        retentionHours=24,
        precisionMode="high-emergency",
        allowAuthorityExport=True,
        allowedViewers=["guardian"],
        updatedAt=_now_utc(),
    )


def _get_policy(profile_id: str) -> TrackerPolicyResponse:
    return _tracker_policies.get(profile_id, _default_policy(profile_id))


def _should_store_event(event: LocationEvent) -> bool:
    policy = _get_policy(event.profileId)
    activity = (event.activity_type or "").lower()

    if policy.mode == "off":
        return False
    if policy.mode == "emergency-only":
        return activity in {"emergency", "panic", "sos"}
    return True


def _apply_precision(location: Location, precision_mode: PrecisionMode, viewer_role: str) -> Location:
    if precision_mode == "high-emergency" and viewer_role == "guardian":
        return location
    if precision_mode == "balanced" and viewer_role == "guardian":
        return Location(lat=round(location.lat, 4), lng=round(location.lng, 4))
    return Location(lat=round(location.lat, 2), lng=round(location.lng, 2))


def _purge_retention(profile_id: str) -> None:
    policy = _get_policy(profile_id)
    retention_cutoff = _now_utc() - timedelta(hours=policy.retentionHours)
    events = _tracker_events.get(profile_id, [])
    _tracker_events[profile_id] = [event for event in events if event.timestamp >= retention_cutoff]


@router.post("/tracker/events", status_code=202)
async def report_location_event(event: LocationEvent) -> dict[str, str]:
    if _should_store_event(event):
        _tracker_events.setdefault(event.profileId, []).append(event)
        _purge_retention(event.profileId)
        _record_audit(event.profileId, "event.recorded", "system", {"activity": event.activity_type or "unknown"})

    return {"status": "accepted", "profileId": event.profileId}


@router.post("/tracker/policies", response_model=TrackerPolicyResponse)
async def set_tracker_policy(policy: TrackerPolicyRequest) -> TrackerPolicyResponse:
    updated = TrackerPolicyResponse(
        profileId=policy.profileId,
        mode=policy.mode,
        retentionHours=policy.retentionHours,
        precisionMode=policy.precisionMode,
        allowAuthorityExport=policy.allowAuthorityExport,
        allowedViewers=policy.allowedViewers,
        updatedAt=_now_utc(),
    )
    _tracker_policies[policy.profileId] = updated
    _purge_retention(policy.profileId)
    _record_audit(policy.profileId, "policy.updated", "guardian", {"mode": policy.mode})
    return updated


@router.get("/tracker/policies/{profile_id}", response_model=TrackerPolicyResponse)
async def get_tracker_policy(profile_id: str) -> TrackerPolicyResponse:
    return _get_policy(profile_id)


@router.get("/tracker/history/{profile_id}", response_model=TrackerHistoryResponse)
async def get_tracker_history(profile_id: str, viewerRole: str = Query(default="guardian")) -> TrackerHistoryResponse:
    policy = _get_policy(profile_id)
    if viewerRole not in policy.allowedViewers and viewerRole != "guardian":
        raise HTTPException(status_code=403, detail="Viewer is not allowed for this profile")

    _purge_retention(profile_id)
    source_events = _tracker_events.get(profile_id, [])
    redacted_events = [
        LocationEvent(
            profileId=event.profileId,
            location=_apply_precision(event.location, policy.precisionMode, viewerRole),
            timestamp=event.timestamp,
            activity_type=event.activity_type,
            battery_level=event.battery_level,
        )
        for event in source_events
    ]
    _record_audit(profile_id, "history.accessed", viewerRole, {"count": str(len(redacted_events))})
    return TrackerHistoryResponse(
        profileId=profile_id,
        viewerRole=viewerRole,
        eventCount=len(redacted_events),
        events=redacted_events,
    )


@router.post("/tracker/history/{profile_id}:export", response_model=TrackerExportResponse)
async def export_tracker_history(profile_id: str, request: TrackerExportRequest) -> TrackerExportResponse:
    policy = _get_policy(profile_id)
    if request.role == "authority" and not policy.allowAuthorityExport:
        raise HTTPException(status_code=403, detail="Authority export is disabled for this profile")
    if request.role not in policy.allowedViewers and request.role != "authority":
        raise HTTPException(status_code=403, detail="Requested role is not allowed")

    _purge_retention(profile_id)
    events = _tracker_events.get(profile_id, [])
    generated_at = _now_utc()
    expires_at = generated_at + timedelta(minutes=request.expiresInMinutes)
    export_id = str(uuid.uuid4())

    canonical_events = [
        {
            "profileId": event.profileId,
            "lat": event.location.lat,
            "lng": event.location.lng,
            "timestamp": event.timestamp.isoformat(),
            "activity_type": event.activity_type,
        }
        for event in events
    ]
    canonical_payload = json.dumps(canonical_events, sort_keys=True, separators=(",", ":"))
    checksum = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
    signature = _sign_payload(f"{profile_id}:{export_id}:{checksum}:{expires_at.isoformat()}")

    _tracker_exports[export_id] = {
        "exportId": export_id,
        "profileId": profile_id,
        "requestedBy": request.requestedBy,
        "role": request.role,
        "scope": request.scope,
        "generatedAt": generated_at,
        "expiresAt": expires_at,
        "checksum": checksum,
        "signature": signature,
        "events": canonical_events,
    }
    _record_audit(profile_id, "history.exported", request.requestedBy, {"role": request.role, "exportId": export_id})

    return TrackerExportResponse(
        exportId=export_id,
        profileId=profile_id,
        requestedBy=request.requestedBy,
        scope=request.scope,
        generatedAt=generated_at,
        expiresAt=expires_at,
        eventCount=len(canonical_events),
        checksum=checksum,
        signature=signature,
    )


@router.get("/tracker/exports/{export_id}", response_model=TrackerExportBundleResponse)
async def get_tracker_export(export_id: str) -> TrackerExportBundleResponse:
    export_record = _tracker_exports.get(export_id)
    if not export_record:
        raise HTTPException(status_code=404, detail="Export not found")

    if _is_export_expired(export_record):
        del _tracker_exports[export_id]
        raise HTTPException(status_code=410, detail="Export has expired")

    signature_valid = _verify_export_signature(export_record)
    if not signature_valid:
        raise HTTPException(status_code=409, detail="Export signature verification failed")

    _record_audit(export_record["profileId"], "export.retrieved", "authority", {"exportId": export_id})
    return TrackerExportBundleResponse(
        exportId=export_record["exportId"],
        profileId=export_record["profileId"],
        requestedBy=export_record["requestedBy"],
        role=export_record["role"],
        scope=export_record["scope"],
        generatedAt=export_record["generatedAt"],
        expiresAt=export_record["expiresAt"],
        eventCount=len(export_record["events"]),
        checksum=export_record["checksum"],
        signature=export_record["signature"],
        signatureValid=signature_valid,
        events=export_record["events"],
    )


@router.get("/tracker/audit/{profile_id}", response_model=TrackerAuditResponse)
async def get_tracker_audit(profile_id: str) -> TrackerAuditResponse:
    entries = _tracker_audit.get(profile_id, [])
    return TrackerAuditResponse(profileId=profile_id, count=len(entries), entries=entries)
