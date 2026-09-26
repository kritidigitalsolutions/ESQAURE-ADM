const API_BASE = '/api/v1/promos';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/promos';

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

const promoService = {
  /** GET /promos/admin */
  getAdminPromos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin${qs ? `?${qs}` : ''}`);
  },

  /** POST /promos/admin */
  createPromo: (data) =>
    request('/admin', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /promos/admin/:id */
  updatePromo: (id, data) =>
    request(`/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** DELETE /promos/admin/:id */
  deletePromo: (id) =>
    request(`/admin/${id}`, { method: 'DELETE' }),

  /** PATCH /promos/admin/:id/toggle */
  togglePromoStatus: (id) =>
    request(`/admin/${id}/toggle`, { method: 'PATCH' }),
};

export default promoService;
