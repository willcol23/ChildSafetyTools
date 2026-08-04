from fastapi import APIRouter, Depends

from child_safety_core.domain import HeatmapOverlay, HeatmapQuery, LocationQuery, ResolvedLocation
from child_safety_core.services import DemoHeatmapService, KnownLocationResolver

router = APIRouter(prefix="/v1", tags=["safety"])

_location_resolver = KnownLocationResolver()
_heatmap_service = DemoHeatmapService(_location_resolver)


def get_location_resolver() -> KnownLocationResolver:
    return _location_resolver


def get_heatmap_service() -> DemoHeatmapService:
    return _heatmap_service


@router.get("/locations:resolve", response_model=ResolvedLocation)
async def resolve_location(
    city: str = "Columbus",
    state: str = "OH",
    resolver: KnownLocationResolver = Depends(get_location_resolver),
) -> ResolvedLocation:
    return await resolver.resolve(LocationQuery(city=city, state=state))


@router.get("/heatmaps/overlay", response_model=HeatmapOverlay)
async def get_heatmap_overlay(
    city: str = "Columbus",
    state: str = "OH",
    radius_km: float = 8.0,
    crime_type: str = "all",
    service: DemoHeatmapService = Depends(get_heatmap_service),
) -> HeatmapOverlay:
    return await service.get_overlay(
        HeatmapQuery(city=city, state=state, radius_km=radius_km, crime_type=crime_type)
    )
