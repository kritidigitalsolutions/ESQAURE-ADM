import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/home', 'http://localhost:5001/api/v1/home');


export const homeService = {
  /**
   * Fetch all home sections for Admin Panel with live calculated Drama counts & metrics
   */
  async getAdminSections() {
    return await request('/admin/sections?limit=50', { method: 'GET' });
  },

  /**
   * Batch reorder section display orders / priority ranks
   */
  async reorderSections(items) {
    return await request('/admin/sections/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  },

  /**
   * Quick toggle section active status
   */
  async toggleSectionStatus(id) {
    return await request(`/admin/sections/${id}/toggle`, {
      method: 'PATCH'
    });
  }
};
