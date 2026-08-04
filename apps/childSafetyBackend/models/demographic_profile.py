from pydantic import BaseModel

class DemographicProfile(BaseModel):
    area_id: str
    population: int
    median_income: float
    median_age: float
