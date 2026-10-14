import { getAdminAuthToken } from './apiClient';

const API_BASE = '/api/v1/promos';
const FALLBACK_BASE = 'http://127.0.0.1:5001/api/v1/promos';

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
    try {
      return await tryFetch(FALLBACK_BASE);
    } catch {
      return await tryFetch('http://localhost:5001/api/v1/promos');
    }
  }
};

const promoService = {
  /** GET /promos/admin */
  getAdminPromos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin${qs ? `?${qs}` : ''}`);
  },

  /** Alias for getAdminPromos for components calling getPromos */
  getPromos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin${qs ? `?${qs}` : ''}`);
  },

  /** GET /promos/admin/:id */
  getPromoById: (id) =>
    request(`/admin/${id}`),

  /** POST /promos/admin */
  createPromo: (data) =>
    request('/admin', { method: 'POST', body: JSON.stringify(data) }),

  /** POST /promos/admin/bulk-generate */
  bulkGeneratePromos: (data) =>
    request('/admin/bulk-generate', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /promos/admin/:id */
  updatePromo: (id, data) =>
    request(`/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** DELETE /promos/admin/:id */
  deletePromo: (id) =>
    request(`/admin/${id}`, { method: 'DELETE' }),

  /** PATCH /promos/admin/:id/toggle */
  togglePromoStatus: (id) =>
    request(`/admin/${id}/toggle`, { method: 'PATCH' }),

  /** POST /promos/validate */
  validatePromo: (code, planId) =>
    request('/validate', { method: 'POST', body: JSON.stringify({ code, planId }) }),

  /** POST /promos/apply */
  applyPromo: (code, planId) =>
    request('/apply', { method: 'POST', body: JSON.stringify({ code, planId }) }),
};

export default promoService;
