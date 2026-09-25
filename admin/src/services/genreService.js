const API_BASE = '/api/v1/genres';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/genres';

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
    // If proxy failed or returned non-JSON, directly reach backend port 5001
    return await tryFetch(`${FALLBACK_BASE}${endpoint}`);
  }
};

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
   * Delete genre permanently (safely unlinks from dramas)
   */
  async deleteGenre(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  }
};
