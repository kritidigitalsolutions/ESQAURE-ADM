import { getAdminAuthToken } from './apiClient';

const API_BASE = '/api/v1/ads';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/ads';

const request = async (endpoint, options = {}) => {
  const token = await getAdminAuthToken();
  const authHeaders = token
    ? { Authorization: `Bearer ${token}`, 'X-Admin-Key': token }
    : {};

  const tryFetch = async (url) => {
    const res = await fetch(`${url}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers
      },
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

  /** GET /ads/custom/rotation-settings */
  getRotationSettings: () => request('/custom/rotation-settings'),

  /** PUT /ads/custom/rotation-settings */
  updateRotationSettings: (data) =>
    request('/custom/rotation-settings', { method: 'PUT', body: JSON.stringify(data) }),

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

  /** GET /ads/custom/:id/analytics */
  getCustomAdAnalytics: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/custom/${id}/analytics${qs ? `?${qs}` : ''}`);
  },

  /** POST /ads/custom/bulk-action */
  bulkAction: (action, ids) =>
    request('/custom/bulk-action', { method: 'POST', body: JSON.stringify({ action, ids }) })
};

export default adService;
