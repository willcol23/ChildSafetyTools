export function initLocationSafetyMapModule() {
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
  function buildDemoCells(location, crime_type = 'all') {
    const lat = location.lat;
    const lng = location.lng;
    const cells = [
      { lat: lat + 0.004, lng: lng + 0.003, intensity: 0.8, count: 6, crime_types: ['burglary'], properties: { source: 'demo' } },
      { lat: lat - 0.003, lng: lng + 0.002, intensity: 0.6, count: 4, crime_types: ['theft'], properties: { source: 'demo' } },
      { lat: lat + 0.002, lng: lng - 0.003, intensity: 0.5, count: 3, crime_types: ['assault'], properties: { source: 'demo' } }
    ];

    if (crime_type && crime_type.toLowerCase() !== 'all') {
      return cells.filter((c) => (c.crime_types || []).some((t) => t.toLowerCase() === crime_type.toLowerCase()));
    }

    return cells;
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
        let locationData;
        try {
          const locationRes = await fetch(`/api/location/resolve?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
          if (locationRes.ok) {
            locationData = await locationRes.json();
          } else {
            console.warn('Location lookup failed, using local fallback');
            locationData = { location: { lat: 39.9612, lng: -82.9988 } };
          }
        } catch (err) {
          console.warn('Location lookup error, using local fallback', err);
          locationData = { location: { lat: 39.9612, lng: -82.9988 } };
        }

        let overlayData;
        try {
          const overlayRes = await fetch(
            `/api/heatmap/overlay?lat=${locationData.location.lat}&lng=${locationData.location.lng}&city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&databases=${encodeURIComponent(databases)}`
          );
          if (overlayRes.ok) {
            overlayData = await overlayRes.json();
          } else {
            console.warn('Overlay lookup failed, using demo cells');
            overlayData = { location: locationData.location, cell_count: 0, cells: buildDemoCells(locationData.location) };
          }
        } catch (err) {
          console.warn('Overlay request error, using demo cells', err);
          overlayData = { location: locationData.location, cell_count: 0, cells: buildDemoCells(locationData.location) };
        }

        await loadAzureMaps();
        renderMap(overlayData.location.lat, overlayData.location.lng, overlayData.cells || []);

        try {
          const saveRes = await fetch('/api/heatmaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              city,
              state,
              databases,
              location: overlayData.location,
              cellCount: overlayData.cell_count || (overlayData.cells || []).length,
              cells: overlayData.cells || [],
              source: 'azure-maps'
            })
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            status.textContent = `Showing ${overlayData.cell_count || (overlayData.cells || []).length} overlay cells for ${city}, ${state}. Saved ${saveData.totalSaved || 0} map snapshots.`;
          } else {
            console.warn('Heatmap save request failed');
            status.textContent = `Showing ${overlayData.cell_count || (overlayData.cells || []).length} overlay cells for ${city}, ${state}. (Save failed)`;
          }
          status.className = 'status success';
        } catch (err) {
          console.warn('Heatmap save error', err);
          status.textContent = `Showing ${overlayData.cell_count || (overlayData.cells || []).length} overlay cells for ${city}, ${state}. (Save failed)`;
          status.className = 'status success';
        }
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      status.className = 'status error';
    }
  });
}
