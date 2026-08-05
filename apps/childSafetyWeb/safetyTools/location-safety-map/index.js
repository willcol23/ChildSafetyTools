import { SafetyApiClient } from '../api/safety-api-client.js';

export function initLocationSafetyMapModule(apiClient = new SafetyApiClient()) {
  const form = document.getElementById('location-form');
  const status = document.getElementById('location-status');
  let mapInstance = null;
  let heatmapLayer = null;
  let mapProvider = null;

  if (!form || !status) {
    return;
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
      return;
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
      return;
    }

    if (!window.L) {
      status.textContent = 'Leaflet is not available.';
      return;
    }

    mapInstance = window.L.map('map').setView([lat, lng], 12);
    mapProvider = 'leaflet';

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    window.L.marker([lat, lng]).addTo(mapInstance).bindPopup('Selected location').openPopup();

    cells.forEach((cell) => {
      window.L.circle([cell.lat, cell.lng], {
        radius: Math.max(600, cell.intensity * 2500),
        color: '#ef4444',
        fillColor: '#f87171',
        fillOpacity: 0.3
      }).addTo(mapInstance);
    });
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Loading map data...';
    status.className = 'status';

    const formData = new FormData(form);
    const city = formData.get('city')?.toString().trim() || 'Columbus';
    const state = formData.get('state')?.toString().trim() || 'OH';
    const databases = (formData.get('databases')?.toString().trim() || 'Default').replace(/\s+/g, '');

    try {
        const overlayData = await apiClient.getHeatmapOverlay({ city, state });

        await loadAzureMaps();
        renderMap(overlayData.location.lat, overlayData.location.lng, overlayData.cells || []);

        status.textContent = `Showing ${overlayData.cell_count || (overlayData.cells || []).length} overlay cells for ${city}, ${state}.`;
        status.className = 'status success';
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      status.className = 'status error';
    }
  });
}
