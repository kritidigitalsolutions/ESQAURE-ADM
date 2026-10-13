import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/legal', 'http://localhost:5001/api/v1/legal');


export const legalService = {
  /**
   * Fetch all legal documents for Admin Panel
   */
  async getAllDocs() {
    return await request('/admin/all', { method: 'GET' });
  },

  /**
   * Update full legal document text and metadata
   */
  async updateDoc(slug, data) {
    return await request(`/admin/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Update statutory Grievance Redressal Officer compliance details
   */
  async updateCompliance(data) {
    return await request('/admin/compliance', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * Toggle document active state
   */
  async toggleDocStatus(slug) {
    return await request(`/admin/${slug}/toggle`, {
      method: 'PATCH'
    });
  },

  /**
   * Re-seed default legal documents
   */
  async seedDocs(force = false) {
    return await request('/admin/seed', {
      method: 'POST',
      body: JSON.stringify({ force })
    });
  },

  /**
   * Client / Mobile retrieval of specific doc
   */
  async getDocBySlug(slug) {
    return await request(`/${slug}`, { method: 'GET' });
  }
};
