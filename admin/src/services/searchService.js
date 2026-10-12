const API_BASE = '/api/v1/search';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/search';

const request = async (endpoint = '', options = {}) => {
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
