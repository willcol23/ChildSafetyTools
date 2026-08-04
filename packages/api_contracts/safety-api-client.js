export class SafetyApiClient {
  constructor(basePath = '/api/safety') {
    this.basePath = basePath;
  }

  async getHeatmapOverlay({ city, state, radiusKm = 8, crimeType = 'all' }) {
    const query = new URLSearchParams({
      city,
      state,
      radius_km: String(radiusKm),
      crime_type: crimeType
    });
    const response = await fetch(`${this.basePath}/heatmaps/overlay?${query}`);
    if (!response.ok) {
      throw new Error('Unable to load safety-map data.');
    }
    return response.json();
  }
}
