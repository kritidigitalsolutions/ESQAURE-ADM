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
