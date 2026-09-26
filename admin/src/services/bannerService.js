const API_BASE = '/api/v1/home';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/home';

const request = async (endpoint, options = {}) => {
  const tryFetch = async (url) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but received ${contentType}`);
    }
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'API request failed');
    }
    return data.data;
  };

  try {
    return await tryFetch(`${API_BASE}${endpoint}`);
  } catch (err) {
    return await tryFetch(`${FALLBACK_BASE}${endpoint}`);
  }
};

export const bannerService = {
  /**
   * Fetch all banners for admin panel with stats
   */
  async getAdminBanners() {
    return await request('/admin/banners', { method: 'GET' });
  },

  /**
   * Create new hero banner
   */
  async createBanner(payload) {
    return await request('/banners', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update existing banner
   */
  async updateBanner(id, payload) {
    return await request(`/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Toggle banner active / inactive
   */
  async toggleActive(id) {
    return await request(`/admin/banners/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  /**
   * Batch reorder banner display sequence
   */
  async reorderBanners(items) {
    return await request('/admin/banners/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  },

  /**
   * Permanently delete a banner
   */
  async deleteBanner(id) {
    return await request(`/banners/${id}`, {
      method: 'DELETE'
    });
  }
};
