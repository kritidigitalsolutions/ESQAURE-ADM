const API_BASE = '/api/v1/vouchers';
const FALLBACK_BASE = 'http://127.0.0.1:5001/api/v1/vouchers';

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
};

const request = async (endpoint, options = {}) => {
  const tryFetch = async (url) => {
    const res = await fetch(`${url}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
      return await tryFetch('http://localhost:5001/api/v1/vouchers');
    }
  }
};

const voucherService = {
  /** GET /vouchers/admin */
  getAdminVouchers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin${qs ? `?${qs}` : ''}`);
  },

  /** GET /vouchers/admin/:id */
  getVoucherById: (id) =>
    request(`/admin/${id}`),

  /** POST /vouchers/admin */
  createVoucher: (data) =>
    request('/admin', { method: 'POST', body: JSON.stringify(data) }),

  /** POST /vouchers/admin/bulk-generate */
  bulkGenerateVouchers: (data) =>
    request('/admin/bulk-generate', { method: 'POST', body: JSON.stringify(data) }),

  /** PATCH /vouchers/admin/:id */
  updateVoucher: (id, data) =>
    request(`/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  /** DELETE /vouchers/admin/:id */
  deleteVoucher: (id) =>
    request(`/admin/${id}`, { method: 'DELETE' }),

  /** PATCH /vouchers/admin/:id/toggle */
  toggleVoucherStatus: (id) =>
    request(`/admin/${id}/toggle`, { method: 'PATCH' }),

  /** POST /vouchers/validate */
  validateVoucher: (code) =>
    request('/validate', { method: 'POST', body: JSON.stringify({ code }) }),

  /** POST /vouchers/redeem */
  redeemVoucher: (payload) =>
    request('/redeem', { method: 'POST', body: JSON.stringify(payload) }),

  /** GET /vouchers/my-history */
  getUserVoucherHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/my-history${qs ? `?${qs}` : ''}`);
  },
};

export default voucherService;
