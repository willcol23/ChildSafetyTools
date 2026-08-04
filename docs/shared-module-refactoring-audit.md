# Shared Module and Decoupling Audit

## Scope and conclusion

The repository has three independently evolving application boundaries:

- `apps/childSafetyBackend`: FastAPI heatmap service.
- `apps/childSafetyWeb`: Express web application and browser client.
- `apps/childSafetyMobile/child-safety-mapper`: Android client **plus a second copy of the FastAPI service**.

The duplicated backend is the immediate refactoring priority. All eight Python source files are byte-for-byte duplicates. The web and mobile clients must depend on one versioned API contract and must not generate authoritative location or heatmap data themselves.

## Files to move out of `apps`

Create a single Python package at `packages/python/child_safety_core/` (published/installable by both service hosts). Move the domain model, application logic, and external-provider adapters there. Keep FastAPI route registration and process configuration in the service app only.

| Current file(s) | Target common module | Why |
| --- | --- | --- |
| `apps/childSafetyBackend/models/crime_event.py` and `apps/childSafetyMobile/child-safety-mapper/backend/app/models/crime_event.py` | `packages/python/child_safety_core/domain/crime_event.py` | Shared crime-event vocabulary. |
| `apps/childSafetyBackend/models/demographic_profile.py` and mobile copy | `packages/python/child_safety_core/domain/demographic_profile.py` | Shared demographics vocabulary. |
| `apps/childSafetyBackend/models/heatmap_cell.py` and mobile copy | `packages/python/child_safety_core/domain/heatmap.py` | Canonical heatmap response types. |
| `apps/childSafetyBackend/services/aggregation.py` and mobile copy | `packages/python/child_safety_core/application/heatmap_service.py` | Shared use case; currently a stub, but it is the correct home for aggregation and scoring. |
| `apps/childSafetyBackend/services/census_client.py` and mobile copy | `packages/python/child_safety_core/infrastructure/census_client.py` | One Census integration and normalization layer. |
| `apps/childSafetyBackend/services/fbi_client.py` and mobile copy | `packages/python/child_safety_core/infrastructure/fbi_client.py` | One FBI integration and normalization layer. |
| `apps/childSafetyBackend/api/routes_heatmap.py` and mobile copy | Split into `packages/python/child_safety_core/application/heatmap_service.py` and `packages/python/child_safety_core/application/location_service.py`; leave a thin FastAPI adapter in the service app | It currently mixes HTTP concerns, a location catalog, demo-data generation, and filtering. |

Do **not** move `main.py` into the common module. It is a composition root: it should create the FastAPI application, load settings, choose concrete providers, and register routes. Delete the duplicated mobile `backend/app/main.py` after the Android app is switched to the shared deployed API; retain one host at a location such as `apps/childSafetyBackend` or rename it `apps/api`.

## Other refactoring targets that must stop owning shared behavior

| File | Refactor | Reason |
| --- | --- | --- |
| `apps/childSafetyMobile/child-safety-mapper/android-app/app/src/main/java/com/safety/child_safety_map/ui/HeatmapScreen.kt` | Split into `HeatmapScreen` (rendering/state), `HeatmapViewModel`, and a `SafetyApi`/`HeatmapRepository` adapter. Remove Android `Geocoder` lookup and random heatmap generation. | It currently owns data retrieval, fallback policy, geocoding, random data generation, mapping SDK conversion, and UI. This yields data different from the web client. |
| `apps/childSafetyWeb/childSafetyTools/apps/location-safety-map/index.js` | Split map rendering from a `SafetyApiClient`. Remove `buildDemoCells`; rendering receives contract `HeatmapOverlay` only. | Browser fallback generates the same demo cells independently of the backend. |
| `apps/childSafetyWeb/server.js` | Split route handlers, `BackendApiClient`, profile repository, file-storage adapter, and configuration. Remove the web-specific proxy endpoints once clients call the shared API gateway/API directly (or keep it as an explicit BFF with the same generated contract). | One file presently handles HTTP server setup, static files, uploads, MongoDB, child profiles, config/secrets, and backend proxying. |
| `apps/childSafetyWeb/models/ChildProfile.js` | Keep it web/server-side for now, but place persistence behind `ChildProfileRepository`. Add a contract DTO separate from the Mongoose schema. | Mongoose is an infrastructure choice and should not define the API model. |
| `apps/childSafetyWeb/app.js` | Retire or consolidate into `childSafetyTools/apps/child-profile/index.js`. | It duplicates profile load/save and navigation behavior; it is a second browser implementation of the child-profile feature. |
| `apps/childSafetyWeb/childSafetyTools/main.js` | Keep as a browser composition root only; inject API clients into feature initializers. | It should wire UI modules, not carry API knowledge via globals. |

## Contract gaps to fix before clients share the API

1. The documented `GET /heatmap` response uses `lon`, `crime_score`, `demographics`, and `incident_count`; the live FastAPI model returns `lng`, `intensity`, `count`, `crime_types`, and `properties`. The document is stale and cannot be used as a client contract.
2. Web calls `/api/location/resolve` and `/api/heatmap/overlay`; Android calls neither and uses the device geocoder plus random points.
3. The web client posts to `/api/heatmaps`, but `apps/childSafetyWeb/server.js` has no such route. This is a live integration defect, not a fallback condition.
4. Browser code sends `lat`/`lng` to the overlay endpoint; the FastAPI endpoint ignores them. Either remove them from the contract or support coordinate-based requests explicitly.
5. `GET /heatmap` and `GET /heatmap/overlay` overlap. Keep one canonical `GET /v1/heatmaps/overlay` endpoint and model location resolution as part of its request, or expose a distinct `GET /v1/locations:resolve` endpoint.

## Proposed contracts and ownership

Store language-neutral API specifications in `packages/contracts/openapi/child-safety-v1.yaml`. Generate typed clients from it for web and Android; validate FastAPI request/response models against it in CI.

```text
web UI ───────┐
              ├─ generated Safety API client ──> API host /v1
Android UI ───┘                                      │
                                                     ▼
                                          application services (common)
                                              │                 │
                                       provider interfaces   repository interfaces
                                              │                 │
                                      FBI/Census adapters   Mongo/file adapters
```

Minimum interfaces (defined in the common Python package) are:

```python
class LocationResolver(Protocol):
    async def resolve(self, query: LocationQuery) -> ResolvedLocation: ...

class CrimeEventProvider(Protocol):
    async def fetch(self, query: CrimeQuery) -> list[CrimeEvent]: ...

class DemographicsProvider(Protocol):
    async def fetch(self, area: Area) -> DemographicProfile: ...

class HeatmapService(Protocol):
    async def get_overlay(self, query: HeatmapQuery) -> HeatmapOverlay: ...
```

Client-specific contracts should be generated DTOs, not domain models. The core owns `LocationQuery`, `HeatmapQuery`, `HeatmapCell`, `HeatmapOverlay`, provider interfaces, and use cases. FastAPI, Express, Android, Google Maps, Azure Maps, MongoDB, HTTPX, and device geocoding are adapters at the edges.

## Recommended implementation order

1. Add the versioned OpenAPI contract and contract tests. Resolve the field and endpoint discrepancies above first.
2. Extract the duplicated Python files to `packages/python/child_safety_core`, creating provider interfaces and a deterministic demo provider for local development. Remove the mobile backend copy.
3. Create the single API host composition root and make its FastAPI routes thin adapters to `HeatmapService`.
4. Add generated or hand-written `SafetyApiClient` implementations for browser and Android. Migrate both clients to the same `resolve/overlay` flow.
5. Split `HeatmapScreen.kt` and `server.js` at the boundaries listed above; migrate web child-profile storage behind a repository interface.
6. Delete web and mobile local heatmap generation. Keep any demo data only in the server-side `DemoCrimeEventProvider`, selected by configuration.

## Tests needed to protect the boundaries

- OpenAPI schema validation and HTTP contract tests for the API host.
- Provider contract tests using mocked FBI/Census responses.
- `HeatmapService` unit tests using fake provider interfaces.
- Web and Android client tests using the same recorded `HeatmapOverlay` fixture.
- A regression test asserting that all user-visible overlay data originates from the API, not device geocoding or random generation.
