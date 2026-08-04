export class SafetyApiClient {
  async getHeatmapOverlay({ city, state }) {
    const params = new URLSearchParams({ city, state, radius_km: '8', crime_type: 'all' });
    const response = await fetch(`/api/safety/heatmaps/overlay?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Unable to load heatmap overlay');
    }
    return response.json();
  }
}
