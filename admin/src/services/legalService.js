const API_BASE = '/api/v1/legal';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/legal';

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
    // If proxy failed, directly reach backend port 5001
    return await tryFetch(`${FALLBACK_BASE}${endpoint}`);
  }
};

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
