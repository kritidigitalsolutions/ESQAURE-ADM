import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/home', 'http://localhost:5001/api/v1/home');


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
