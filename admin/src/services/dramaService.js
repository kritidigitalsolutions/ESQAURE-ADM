const API_BASE = '/api/v1/dramas';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/dramas';

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
    // If proxy failed or returned non-JSON/HTML, directly reach backend port 5001
    return await tryFetch(`${FALLBACK_BASE}${endpoint}`);
  }
};

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
   */
  async updatePriority(id, priority) {
    return await request(`/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority })
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
  }
};
