import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/dramas', 'http://localhost:5001/api/v1/dramas');


export const dramaService = {
  /**
   * Fetch admin dramas catalog list with real stats
   */
  async getAdminDramas() {
    return await request('/admin', { method: 'GET' });
  },

  /**
   * Fetch single drama by ID with episodes
   */
  async getDramaById(id) {
    return await request(`/${id}`, { method: 'GET' });
  },

  /**
   * Create new drama series
   */
  async createDrama(payload) {
    return await request('', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update drama details
   */
  async updateDrama(id, payload) {
    return await request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete drama series permanently
   */
  async deleteDrama(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Toggle drama active (PUBLISHED) vs inactive (DRAFT) status
   */
  async toggleActive(id) {
    return await request(`/${id}/toggle-active`, {
      method: 'PATCH'
    });
  },

  /**
   * Toggle drama paid (with plan) vs free tier status
   */
  async togglePaid(id) {
    return await request(`/${id}/toggle-paid`, {
      method: 'PATCH'
    });
  },

  /**
   * Update drama priority rank
   * @param {string} id - Drama ID
   * @param {number|object} payload - Either number (target rank) or { direction: 'up'|'down', moveTo: 'top'|'bottom', priority: number }
   */
  async updatePriority(id, payload) {
    const body = typeof payload === 'number' ? { priority: payload } : payload;
    return await request(`/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  /**
   * Batch reorder all drama priorities in the catalog
   * @param {Array<{id: string, priority: number}>} items
   */
  async reorderDramas(items) {
    return await request('/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  },

  /**
   * Save / update episodes and paywall rules for a drama
   */
  async saveEpisodes(id, { episodes, freeEpisodes }) {
    return await request(`/${id}/episodes/admin`, {
      method: 'POST',
      body: JSON.stringify({ episodes, freeEpisodes })
    });
  },

  /**
   * Reconcile drama view counts (synchronize drama view count from episodes)
   */
  async reconcileViews(id) {
    return await request(`/${id}/reconcile-views`, { method: 'POST' });
  },

  /**
   * Fetch real view analytics timeseries and unique viewers
   */
  async getViewAnalytics(id, days = 30) {
    return await request(`/${id}/view-analytics?days=${days}`, { method: 'GET' });
  }
};
