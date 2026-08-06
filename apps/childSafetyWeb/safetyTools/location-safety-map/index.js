import { SafetyApiClient } from '../../api/safety-api-client.js';

export function initLocationSafetyMapModule(apiClient = new SafetyApiClient()) {
  const form = document.getElementById('location-form');
  const status = document.getElementById('location-status');
  const submitButton = form?.querySelector("button[type='submit']");
  let mapInstance = null;
  let heatmapLayer = null;
  let mapProvider = null;
  let lastSubmittedQueryKey = '';
  let isSubmitting = false;

  if (!form || !status) {
    return;
  }

  function buildQueryKey(query) {
    return `${query.city}|${query.state}|${query.crimeType}`;
  }

  function getCurrentQuery() {
    const formData = new FormData(form);
    return {
      city: formData.get('city')?.toString().trim() || 'Columbus',
      state: (formData.get('state')?.toString().trim() || 'OH').toUpperCase(),
      crimeType: (formData.get('crime_type')?.toString().trim() || 'all').toLowerCase()
    };
  }

  function refreshSubmitState() {
    if (!submitButton) {
      return;
    }

    const hasPendingChanges = buildQueryKey(getCurrentQuery()) !== lastSubmittedQueryKey;
    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting
      ? 'Loading...'
      : (hasPendingChanges ? 'Update Heatmap' : 'Reload Heatmap');
  }

  function onQueryFieldChange() {
    refreshSubmitState();
    if (!lastSubmittedQueryKey || isSubmitting) {
      return;
    }

    const hasPendingChanges = buildQueryKey(getCurrentQuery()) !== lastSubmittedQueryKey;
    if (hasPendingChanges) {
      status.textContent = 'Parameters changed. Click Update Heatmap to refresh the map.';
      status.className = 'status';
    }
  }

  function resolveMapCenter(overlayData, resolvedLocation) {
    const fallback = overlayData?.location || {};
    const resolved = resolvedLocation?.location || {};
    return {
      lat: Number.isFinite(resolved.lat) ? resolved.lat : fallback.lat,
      lng: Number.isFinite(resolved.lng) ? resolved.lng : fallback.lng
    };
  }

  function clearMap() {
    const mapContainer = document.getElementById('map');
    if (mapProvider === 'leaflet' && mapInstance && window.L && typeof mapInstance.remove === 'function') {
      mapInstance.remove();
    }
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }
    mapInstance = null;
    heatmapLayer = null;
    mapProvider = null;
  }

  async function loadAzureMaps() {
    if (window.atlas?.Map) {
      return true;
    }

    const subscriptionKey = window.AZURE_MAPS_API_KEY || '';
    if (!subscriptionKey) {
      return false;
    }

    if (document.getElementById('azure-maps-script')) {
      return Boolean(window.atlas?.Map);
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'azure-maps-script';
      script.src = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/2/atlas.min.js?api-version=2';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    if (window.atlas) {
      window.atlas.setSubscriptionKey(subscriptionKey);
    }

    return Boolean(window.atlas?.Map);
  }

  function renderMap(lat, lng, cells = []) {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      return false;
    }

    clearMap();

    if (window.atlas?.Map && window.AZURE_MAPS_API_KEY) {
      mapInstance = new window.atlas.Map(mapContainer, {
        center: [lng, lat],
        zoom: 12,
        style: 'road',
        authOptions: {
          authType: 'subscriptionKey',
          subscriptionKey: window.AZURE_MAPS_API_KEY
        }
      });
      mapProvider = 'azure';

      if (window.atlas?.HtmlMarker) {
        const marker = new window.atlas.HtmlMarker({
          position: [lng, lat],
          popup: new window.atlas.Popup().setText('Selected location')
        });
        mapInstance.markers.add(marker);
      }
      return true;
    }

    if (!window.L) {
      return false;
    }

    mapInstance = window.L.map('map').setView([lat, lng], 12);
    mapProvider = 'leaflet';

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    window.L.marker([lat, lng]).addTo(mapInstance).bindPopup('Selected location').openPopup();

    cells.forEach((cell) => {
      const circle = window.L.circle([cell.lat, cell.lng], {
        radius: Math.max(600, cell.intensity * 2500),
        color: '#ef4444',
        fillColor: '#f87171',
        fillOpacity: 0.3
      }).addTo(mapInstance);

      const crimeTypesLabel = Array.isArray(cell.crime_types) && cell.crime_types.length
        ? cell.crime_types.join(', ')
        : 'Unknown';
      const intensityLabel = Number.isFinite(cell.intensity) ? cell.intensity.toFixed(2) : 'n/a';
      circle.bindTooltip(
        `Incidents: ${cell.count || 0}<br>Intensity: ${intensityLabel}<br>Crime Types: ${crimeTypesLabel}`,
        { sticky: true }
      );
      circle.on('mouseover', () => circle.openTooltip());
      circle.on('mouseout', () => circle.closeTooltip());
    });

    return true;
  }
  form.addEventListener('input', onQueryFieldChange);
  form.addEventListener('change', onQueryFieldChange);

  refreshSubmitState();

  async function refreshMapByParameters(forceRerender = false) {
    const query = getCurrentQuery();
    const queryKey = buildQueryKey(query);
    const shouldRerender = forceRerender || queryKey !== lastSubmittedQueryKey;

    if (!shouldRerender) {
      status.textContent = 'Parameters unchanged. Click Reload Heatmap to refetch and rerender anyway.';
      status.className = 'status';
      refreshSubmitState();
      return;
    }

    isSubmitting = true;
    refreshSubmitState();
    status.textContent = 'Loading map data...';
    status.className = 'status';

    try {
      const [overlayResult, centerResult] = await Promise.allSettled([
        apiClient.getHeatmapOverlay(query),
        apiClient.getMapCenter(query)
      ]);

      if (overlayResult.status !== 'fulfilled') {
        throw overlayResult.reason;
      }

      const overlayData = overlayResult.value;
      const resolvedLocation = centerResult.status === 'fulfilled' ? centerResult.value : null;

      await loadAzureMaps();
      const center = resolveMapCenter(overlayData, resolvedLocation);
      const rendered = renderMap(center.lat, center.lng, overlayData.cells || []);
      if (!rendered) {
        throw new Error('Unable to render map. Confirm Azure Maps key or Leaflet availability.');
      }

      lastSubmittedQueryKey = queryKey;
      const selectedCrimeLabel = query.crimeType === 'all' ? 'all crime types' : query.crimeType;
      const refreshedAt = new Date().toLocaleTimeString();
      status.textContent = `Showing ${overlayData.cell_count || (overlayData.cells || []).length} overlay cells for ${query.city}, ${query.state} (${selectedCrimeLabel}). Refreshed at ${refreshedAt}.`;
      status.className = 'status success';
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      status.className = 'status error';
    } finally {
      isSubmitting = false;
      refreshSubmitState();
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await refreshMapByParameters(true);
  });
}
