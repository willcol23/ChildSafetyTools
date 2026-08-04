from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class LocationQuery(BaseModel):
    city: str = "Columbus"
    state: str = "OH"


class Location(BaseModel):
    lat: float
    lng: float


class ResolvedLocation(BaseModel):
    city: str
    state: str
    location: Location


class HeatmapQuery(LocationQuery):
    radius_km: float = Field(default=8.0, gt=0)
    crime_type: str = "all"


class HeatmapCell(BaseModel):
    lat: float
    lng: float
    intensity: float = Field(ge=0, le=1)
    count: int = Field(ge=0)
    crime_types: list[str] = Field(default_factory=list)
    properties: dict[str, Any] = Field(default_factory=dict)


class HeatmapOverlay(BaseModel):
    location: Location
    radius_km: float
    filters: dict[str, Any]
    cell_count: int
    cells: list[HeatmapCell]


class CrimeEvent(BaseModel):
    id: str
    lat: float
    lon: float
    offense_type: str
    date: datetime | None = None
    victim_age: int | None = None
    victim_sex: str | None = None
    agency_ori: str | None = None


class DemographicProfile(BaseModel):
    area_id: str
    population: int
    median_income: float
    median_age: float


class Attachment(BaseModel):
    id: str
    name: str
    content_type: str
    url: str | None = None


class ChildProfile(BaseModel):
    id: str | None = None
    name: str
    dob: str
    description: str | None = None
    attachments: list[Attachment] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class LocationEvent(BaseModel):
    profileId: str
    location: Location
    timestamp: datetime
    activity_type: str | None = None
    battery_level: float | None = None


class SecureMessage(BaseModel):
    id: str | None = None
    senderId: str
    recipientId: str
    body: str
    timestamp: int | None = None
    isEncrypted: bool = True
