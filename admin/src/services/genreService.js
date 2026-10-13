import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/genres', 'http://localhost:5001/api/v1/genres');


export const genreService = {
  /**
   * Fetch all genres for Admin Panel with live calculated Drama counts & metrics
   */
  async getAdminGenres() {
    return await request('/admin', { method: 'GET' });
  },

  /**
   * Fetch active genres only (public / dropdowns)
   */
  async getActiveGenres() {
    return await request('', { method: 'GET' });
  },

  /**
   * Fetch single genre by ID or slug with linked dramas
   */
  async getGenreById(id) {
    return await request(`/${id}`, { method: 'GET' });
  },

  /**
   * Create a new genre category
   */
  async createGenre(payload) {
    return await request('', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update existing genre category
   */
  async updateGenre(id, payload) {
    return await request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Quick toggle active vs hidden status
   */
  async toggleActive(id) {
    return await request(`/${id}/toggle-active`, {
      method: 'PATCH'
    });
  },

  /**
   * Quick toggle trending status
   */
  async toggleTrending(id) {
    return await request(`/${id}/toggle-trending`, {
      method: 'PATCH'
    });
  },

  /**
   * Quick toggle popular genres status
   */
  async togglePopular(id) {
    return await request(`/${id}/toggle-popular`, {
      method: 'PATCH'
    });
  },

  /**
   * Delete genre permanently (safely unlinks from dramas)
   */
  async deleteGenre(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Batch reorder genre display orders / priority ranks
   */
  async reorderGenres(items) {
    return await request('/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ items })
    });
  }
};
