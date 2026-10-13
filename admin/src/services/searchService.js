import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/search', 'http://localhost:5001/api/v1/search');


export const searchService = {
  /**
   * Search dramas and series across titles, synopsis, tags & genres
   * GET /api/v1/search?q=...
   */
  async search(query, params = {}) {
    const queryParams = new URLSearchParams({
      q: query || '',
      limit: params.limit || 20,
      ...(params.page ? { page: params.page } : {}),
      ...(params.genre ? { genre: params.genre } : {})
    });
    return await request(`?${queryParams.toString()}`);
  },

  /**
   * Fast autocomplete suggestions
   * GET /api/v1/search/suggestions?q=...
   */
  async getSuggestions(query, limit = 8) {
    const queryParams = new URLSearchParams({
      q: query || '',
      limit
    });
    return await request(`/suggestions?${queryParams.toString()}`);
  },

  /**
   * Ranked popular searches
   * GET /api/v1/search/popular
   */
  async getPopular(limit = 10) {
    return await request(`/popular?limit=${limit}`);
  }
};

export default searchService;
