from typing import Any, Dict, List

from pydantic import BaseModel

class HeatmapCell(BaseModel):
    lat: float
    lng: float
    intensity: float
    count: int
    crime_types: List[str] = []
    properties: Dict[str, Any] = {}
