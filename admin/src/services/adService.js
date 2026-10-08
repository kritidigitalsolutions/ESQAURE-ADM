const API_BASE = '/api/v1/ads';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/ads';

const request = async (endpoint, options = {}) => {
  const tryFetch = async (url) => {
    const res = await fetch(`${url}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw { response: { data } };
    return data;
  };

  try {
    return await tryFetch(API_BASE);
  } catch (err) {
    if (err?.response) throw err;
    return await tryFetch(FALLBACK_BASE);
  }
};

const adService = {
  /** GET /ads/settings */
  getSettings: () => request('/settings'),

  /** PUT /ads/settings */
  updateSettings: (data) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  /** GET /ads/custom */
  getCustomAds: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/custom${qs ? `?${qs}` : ''}`);
  },

  /** POST /ads/custom */
  createCustomAd: (data) =>
    request('/custom', { method: 'POST', body: JSON.stringify(data) }),

  /** GET /ads/custom/:id */
  getCustomAdById: (id) => request(`/custom/${id}`),

  /** PUT /ads/custom/:id */
  updateCustomAd: (id, data) =>
    request(`/custom/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** DELETE /ads/custom/:id */
  deleteCustomAd: (id) =>
    request(`/custom/${id}`, { method: 'DELETE' }),

  /** PATCH /ads/custom/:id/toggle */
  toggleCustomAdStatus: (id) =>
    request(`/custom/${id}/toggle`, { method: 'PATCH' }),

  /** POST /ads/custom/:id/reset-stats */
  resetCustomAdStats: (id) =>
    request(`/custom/${id}/reset-stats`, { method: 'POST' }),
};

export default adService;
