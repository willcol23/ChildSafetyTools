from typing import Protocol

from .domain import HeatmapOverlay, HeatmapQuery, LocationQuery, ResolvedLocation


class LocationResolver(Protocol):
    async def resolve(self, query: LocationQuery) -> ResolvedLocation: ...


class HeatmapService(Protocol):
    async def get_overlay(self, query: HeatmapQuery) -> HeatmapOverlay: ...
