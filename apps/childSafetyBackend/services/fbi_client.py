import httpx
from typing import List
from ..models.crime_event import CrimeEvent

class FBIClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.usa.gov/crime/fbi/sapi"

    async def get_crime_incidents(self, ori: str, offense: str) -> List[CrimeEvent]:
        # Implementation will go here
        return []
