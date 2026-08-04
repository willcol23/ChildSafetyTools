from fastapi import APIRouter
from typing import Dict, List, Optional

from app.models.heatmap_cell import HeatmapCell

router = APIRouter(prefix="/heatmap", tags=["heatmap"])


def _resolve_location(city: str, state: Optional[str] = None) -> Dict[str, float]:
    city_key = (city or "Columbus").strip().lower()
    state_key = (state or "OH").strip().lower()

    known_locations = {
        "columbus:oh": {"lat": 39.9612, "lng": -82.9988},
        "new york:ny": {"lat": 40.7128, "lng": -74.0060},
        "los angeles:ca": {"lat": 34.0522, "lng": -118.2437},
        "chicago:il": {"lat": 41.8781, "lng": -87.6298},
    }

    return known_locations.get(f"{city_key}:{state_key}", known_locations["columbus:oh"])


def _build_demo_cells(location: Dict[str, float], crime_type: str) -> List[HeatmapCell]:
    lat = location["lat"]
    lng = location["lng"]

    cells = [
        HeatmapCell(
            lat=lat + 0.004,
            lng=lng + 0.003,
            intensity=0.8,
            count=6,
            crime_types=["burglary"],
            properties={"source": "demo"},
        ),
        HeatmapCell(
            lat=lat - 0.003,
            lng=lng + 0.002,
            intensity=0.6,
            count=4,
            crime_types=["theft"],
            properties={"source": "demo"},
        ),
        HeatmapCell(
            lat=lat + 0.002,
            lng=lng - 0.003,
            intensity=0.5,
            count=3,
            crime_types=["assault"],
            properties={"source": "demo"},
        ),
    ]

    if crime_type and crime_type.lower() != "all":
        cells = [cell for cell in cells if crime_type.lower() in [t.lower() for t in cell.crime_types]]

    return cells


@router.get("/", response_model=List[HeatmapCell])
async def get_heatmap(
    city: str = "Columbus",
    state: Optional[str] = None,
    crime_type: str = "all",
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    location = _resolve_location(city, state)
    return _build_demo_cells(location, crime_type)


@router.get("/overlay")
async def get_heatmap_overlay(
    city: str = "Columbus",
    state: Optional[str] = None,
    radius_km: float = 8.0,
    crime_type: str = "all",
    databases: Optional[str] = "Default",
):
    location = _resolve_location(city, state)
    cells = _build_demo_cells(location, crime_type)

    return {
        "location": location,
        "radius_km": radius_km,
        "filters": {
            "city": city,
            "state": state,
            "crime_type": crime_type,
            "databases": databases,
        },
        "cell_count": len(cells),
        "cells": [cell.dict() for cell in cells],
    }
