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
