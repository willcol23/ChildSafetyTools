from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CrimeEvent(BaseModel):
    id: str
    lat: float
    lon: float
    offense_type: str
    date: datetime
    victim_age: Optional[int] = None
    victim_sex: Optional[str] = None
    agency_ori: str
