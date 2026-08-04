from typing import List

from child_safety_core.domain import CrimeEvent, DemographicProfile, HeatmapCell
from child_safety_core.services import aggregate_heatmap as aggregate_heatmap_shared


def aggregate_heatmap(crimes: List[CrimeEvent], demographics: List[DemographicProfile]) -> List[HeatmapCell]:
    return aggregate_heatmap_shared(crimes, demographics)
