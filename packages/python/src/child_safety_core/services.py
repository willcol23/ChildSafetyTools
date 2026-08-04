from .domain import (
    CrimeEvent,
    DemographicProfile,
    HeatmapCell,
    HeatmapOverlay,
    HeatmapQuery,
    Location,
    LocationQuery,
    ResolvedLocation,
)


def aggregate_heatmap(crimes: list[CrimeEvent], demographics: list[DemographicProfile]) -> list[HeatmapCell]:
    """Group crimes into heatmap cells using a deterministic binning strategy."""
    if not crimes:
        return []

    buckets: dict[tuple[float, float], dict[str, object]] = {}
    for crime in crimes:
        key = (round(crime.lat, 2), round(crime.lon, 2))
        bucket = buckets.setdefault(
            key,
            {"count": 0, "crime_types": set(), "intensity": 0.0},
        )
        bucket["count"] = int(bucket["count"]) + 1
        bucket["crime_types"].add(crime.offense_type)
        bucket["intensity"] = min(1.0, float(bucket["intensity"]) + 0.2)

    population_factor = 0.0
    if demographics:
        population_factor = min(1.0, sum(profile.population for profile in demographics) / max(len(demographics), 1) / 10000.0)

    cells: list[HeatmapCell] = []
    for (lat, lng), bucket in sorted(buckets.items(), key=lambda item: item[1]["count"], reverse=True)[:5]:
        crime_types = sorted(bucket["crime_types"])
        intensity = min(1.0, float(bucket["intensity"]) + population_factor * 0.1)
        cells.append(
            HeatmapCell(
                lat=lat,
                lng=lng,
                intensity=intensity,
                count=int(bucket["count"]),
                crime_types=crime_types,
                properties={"source": "aggregated"},
            )
        )

    return cells


class KnownLocationResolver:
    """Deterministic local resolver; replace via the LocationResolver port in production."""

    _locations = {
        "columbus:oh": Location(lat=39.9612, lng=-82.9988),
        "new york:ny": Location(lat=40.7128, lng=-74.0060),
        "los angeles:ca": Location(lat=34.0522, lng=-118.2437),
        "chicago:il": Location(lat=41.8781, lng=-87.6298),
    }

    async def resolve(self, query: LocationQuery) -> ResolvedLocation:
        city = (query.city or "Columbus").strip()
        state = (query.state or "OH").strip()
        location = self._locations.get(f"{city.lower()}:{state.lower()}", self._locations["columbus:oh"])
        return ResolvedLocation(city=city, state=state, location=location)


class DemoHeatmapService:
    """Server-side demo implementation; clients never fabricate safety data."""

    def __init__(self, locations: KnownLocationResolver):
        self._locations = locations

    async def get_overlay(self, query: HeatmapQuery) -> HeatmapOverlay:
        resolved = await self._locations.resolve(query)
        lat, lng = resolved.location.lat, resolved.location.lng
        cells = [
            HeatmapCell(lat=lat + .004, lng=lng + .003, intensity=.8, count=6, crime_types=["burglary"], properties={"source": "demo"}),
            HeatmapCell(lat=lat - .003, lng=lng + .002, intensity=.6, count=4, crime_types=["theft"], properties={"source": "demo"}),
            HeatmapCell(lat=lat + .002, lng=lng - .003, intensity=.5, count=3, crime_types=["assault"], properties={"source": "demo"}),
        ]
        if query.crime_type.lower() != "all":
            cells = [cell for cell in cells if query.crime_type.lower() in {kind.lower() for kind in cell.crime_types}]
        return HeatmapOverlay(
            location=resolved.location,
            radius_km=query.radius_km,
            filters={"city": resolved.city, "state": resolved.state, "crime_type": query.crime_type},
            cell_count=len(cells),
            cells=cells,
        )
