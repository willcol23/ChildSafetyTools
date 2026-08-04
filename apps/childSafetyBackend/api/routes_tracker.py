from fastapi import APIRouter
from child_safety_core.domain import LocationEvent

router = APIRouter(prefix="/v1", tags=["tracker"])


@router.post("/tracker/events", status_code=202)
async def report_location_event(event: LocationEvent) -> dict[str, str]:
    return {"status": "accepted", "profileId": event.profileId}
