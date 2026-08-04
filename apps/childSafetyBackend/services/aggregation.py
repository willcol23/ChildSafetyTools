from typing import List
from ..models.heatmap_cell import HeatmapCell
from ..models.crime_event import CrimeEvent
from ..models.demographic_profile import DemographicProfile

def aggregate_heatmap(crimes: List[CrimeEvent], demographics: List[DemographicProfile]) -> List[HeatmapCell]:
    # Grid binning and scoring logic will go here
    return []
