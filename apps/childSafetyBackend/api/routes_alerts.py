from __future__ import annotations

import base64
import os
import uuid
from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/alerts", tags=["alerts"])


class AlertLocation(BaseModel):
    lat: float
    lng: float
    accuracy_m: float | None = None
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HelpAlertRequest(BaseModel):
    profileId: str = Field(min_length=1)
    recipientId: str = Field(min_length=1)
    encryptedPayload: str = Field(min_length=1)
    channel: str = "guardian"
    hiddenMode: bool = True
    retentionMinutes: int | None = Field(default=None, ge=5, le=7 * 24 * 60)
    location: AlertLocation | None = None


class HelpAlertResponse(BaseModel):
    alertId: str
    status: str
    createdAt: datetime
    expiresAt: datetime


class HelpAlertLocationRequest(BaseModel):
    location: AlertLocation


def _build_cipher() -> Fernet:
    configured_key = os.getenv("ALERT_ENCRYPTION_KEY", "").strip()
    if configured_key:
        try:
            return Fernet(configured_key.encode("utf-8"))
        except (ValueError, TypeError):
            pass

    # Deterministic fallback for local development only.
    raw_key = os.getenv("APP_SECRET", "dev-alert-key").encode("utf-8")
    normalized = raw_key.ljust(32, b"0")[:32]
    generated = base64.urlsafe_b64encode(normalized)
    return Fernet(generated)


def _encrypt_for_storage(plaintext_or_ciphertext: str) -> str:
    cipher = _build_cipher()
    try:
        # If the payload is already Fernet ciphertext we preserve as-is.
        cipher.decrypt(plaintext_or_ciphertext.encode("utf-8"))
        return plaintext_or_ciphertext
    except (InvalidToken, ValueError):
        return cipher.encrypt(plaintext_or_ciphertext.encode("utf-8")).decode("utf-8")


_alerts_store: dict[str, dict] = {}


def _retention_minutes(requested_minutes: int | None) -> int:
    configured = os.getenv("ALERT_RETENTION_MINUTES", "1440").strip()
    default_minutes = 1440
    if configured.isdigit():
        default_minutes = max(5, min(int(configured), 7 * 24 * 60))
    if requested_minutes is None:
        return default_minutes
    return max(5, min(requested_minutes, 7 * 24 * 60))


def _purge_expired_alerts() -> int:
    now = datetime.now(timezone.utc)
    expired_ids = [alert_id for alert_id, record in _alerts_store.items() if record.get("expiresAt") and record["expiresAt"] <= now]
    for alert_id in expired_ids:
        del _alerts_store[alert_id]
    return len(expired_ids)


@router.post("/help", response_model=HelpAlertResponse, status_code=201)
async def create_help_alert(payload: HelpAlertRequest) -> HelpAlertResponse:
    _purge_expired_alerts()

    alert_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    retention_minutes = _retention_minutes(payload.retentionMinutes)
    expires_at = created_at + timedelta(minutes=retention_minutes)
    encrypted_payload = _encrypt_for_storage(payload.encryptedPayload)

    _alerts_store[alert_id] = {
        "alertId": alert_id,
        "status": "created",
        "createdAt": created_at,
        "expiresAt": expires_at,
        "profileId": payload.profileId,
        "recipientId": payload.recipientId,
        "channel": payload.channel,
        "hiddenMode": payload.hiddenMode,
        "encryptedPayload": encrypted_payload,
        "locations": [payload.location.model_dump()] if payload.location else [],
    }

    return HelpAlertResponse(alertId=alert_id, status="created", createdAt=created_at, expiresAt=expires_at)


@router.post("/help/{alert_id}/locations", status_code=202)
async def append_help_alert_location(alert_id: str, payload: HelpAlertLocationRequest) -> dict[str, str]:
    _purge_expired_alerts()

    alert = _alerts_store.get(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert["locations"].append(payload.location.model_dump())
    alert["status"] = "tracking"
    return {"status": "accepted", "alertId": alert_id}


@router.post("/maintenance/purge", status_code=200)
async def purge_expired_help_alerts() -> dict[str, int]:
    purged_count = _purge_expired_alerts()
    return {"purged": purged_count, "active": len(_alerts_store)}
