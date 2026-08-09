export class SafetyApiClient {
  buildApiUrl(path, params) {
    const isFileProtocol = window.location?.protocol === 'file:';
    const configuredOrigin = window.CHILD_SAFETY_WEB_ORIGIN || localStorage.getItem('childSafetyWebOrigin') || 'http://localhost:3000';
    const baseOrigin = isFileProtocol ? configuredOrigin : window.location.origin;
    const url = new URL(path, baseOrigin);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  async fetchJson(path, params) {
    const requestUrl = this.buildApiUrl(path, {
      ...params,
      _ts: Date.now().toString()
    });
    const response = await fetch(requestUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error('Unable to load map data');
    }
    return response.json();
  }

  async postJson(path, body) {
    const requestUrl = this.buildApiUrl(path, {
      _ts: Date.now().toString()
    });
    const response = await fetch(requestUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      },
      body: JSON.stringify(body || {})
    });

    if (!response.ok) {
      throw new Error('Unable to process safety request');
    }

    return response.json();
  }

  async getHeatmapOverlay({ city, state, crimeType = 'all' }) {
    return this.fetchJson('/api/safety/heatmaps/overlay', {
      city,
      state,
      radius_km: '8',
      crime_type: crimeType
    });
  }

  async getMapCenter({ city, state }) {
    return this.fetchJson('/api/safety/locations/resolve', {
      city,
      state
    });
  }

  async createHelpAlert(payload) {
    return this.postJson('/api/safety/alerts/help', payload);
  }

  async appendHelpAlertLocation(alertId, payload) {
    return this.postJson(`/api/safety/alerts/help/${alertId}/locations`, payload);
  }

  async setTrackerPolicy(payload) {
    return this.postJson('/api/tracker/policies', payload);
  }

  async getTrackerPolicy(profileId) {
    return this.fetchJson(`/api/tracker/policies/${encodeURIComponent(profileId)}`, {});
  }

  async getTrackerHistory(profileId, viewerRole = 'guardian') {
    return this.fetchJson(`/api/tracker/history/${encodeURIComponent(profileId)}`, { viewerRole });
  }

  async exportTrackerHistory(profileId, payload) {
    return this.postJson(`/api/tracker/history/${encodeURIComponent(profileId)}/export`, payload);
  }

  async getTrackerAudit(profileId) {
    return this.fetchJson(`/api/tracker/audit/${encodeURIComponent(profileId)}`, {});
  }

  async getTrackerExport(exportId) {
    return this.fetchJson(`/api/tracker/exports/${encodeURIComponent(exportId)}`, {});
  }
}
