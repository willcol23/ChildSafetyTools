import pytest

from child_safety_core.domain import CrimeEvent, DemographicProfile, HeatmapQuery
from child_safety_core.services import DemoHeatmapService, KnownLocationResolver, aggregate_heatmap


@pytest.mark.asyncio
async def test_demo_heatmap_service_returns_overlay_with_expected_cells():
    service = DemoHeatmapService(KnownLocationResolver())
    result = await service.get_overlay(HeatmapQuery(city="Columbus", state="OH", radius_km=8.0, crime_type="all"))

    assert result.cell_count == 3
    assert len(result.cells) == 3
    assert result.cells[0].properties["source"] == "demo"
    assert result.location.lat == 39.9612
    assert result.location.lng == -82.9988

@pytest.mark.asyncio
async def test_demo_heatmap_service_uses_fallsback_to_default_location():
    service = DemoHeatmapService(KnownLocationResolver())
    result = await service.get_overlay(HeatmapQuery(city="UnknownCity", state="XX", radius_km=8.0, crime_type="all"))

    assert result.cell_count == 3
    assert len(result.cells) == 3
    assert result.cells[0].properties["source"] == "demo"
    assert result.location.lat == 39.9612
    assert result.location.lng == -82.9988


@pytest.mark.asyncio
async def test_demo_heatmap_service_filters_by_crime_type():
    service = DemoHeatmapService(KnownLocationResolver())
    result = await service.get_overlay(HeatmapQuery(city="Columbus", state="OH", radius_km=8.0, crime_type="theft"))

    assert len(result.cells) == 1
    assert result.cells[0].crime_types[0].lower() == "theft"

@pytest.mark.asyncio
async def test_demo_heatmap_service_rejects_radius_less_than_minimum():
    with pytest.raises(ValueError):
        HeatmapQuery(city="Columbus", state="OH", radius_km=0.0, crime_type="THEFT")

@pytest.mark.asyncio
async def test_demo_heatmap_service_rejects_unknown_crime_type_returns_0_cells():
    service = DemoHeatmapService(KnownLocationResolver())
    result = await service.get_overlay(HeatmapQuery(city="Columbus", state="OH", radius_km=8.0, crime_type="unknown"))

    assert result.cell_count == 0
    assert len(result.cells) == 0

def test_aggregate_heatmap_groups_crimes_into_heatmap_cells():
    crimes = [
        CrimeEvent(id="1", lat=39.9612, lon=-82.9988, offense_type="burglary"),
        CrimeEvent(id="2", lat=39.9612, lon=-82.9988, offense_type="theft"),
    ]
    demographics = [DemographicProfile(area_id="A1", population=5000, median_income=60000, median_age=34)]

    result = aggregate_heatmap(crimes, demographics)

    assert len(result) == 1
    assert result[0].count == 2
    assert result[0].crime_types == ["burglary", "theft"]
    assert result[0].properties["source"] == "aggregated"

def test_create_cells_creates_heatmap_cell_with_correct_properties():
    service = DemoHeatmapService(KnownLocationResolver())
    cell = service.create_heatmap_cell(lat=39.9612, lng=-82.9988, intensity=0.8, count=6, crime_type="burglary")
    assert cell.lat == 39.9612
    assert cell.lng == -82.9988
    assert cell.intensity == 0.8
    assert cell.count == 6
    assert cell.crime_types == ["burglary"]
    assert cell.properties["source"] == "demo"
