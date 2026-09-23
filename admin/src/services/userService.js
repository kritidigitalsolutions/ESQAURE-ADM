const API_BASE = '/api/v1/users';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/users';

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

export const userService = {
  /**
   * Fetch users list with optional search and tab filter
   */
  async getUsers({ search = '', filter = 'ALL', page = 1, limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter && filter !== 'ALL') params.append('filter', filter);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await request(queryString, { method: 'GET' });
  },

  /**
   * Fetch a single user by ID
   */
  async getUserById(id) {
    return await request(`/${id}`, { method: 'GET' });
  },

  /**
   * Update user basic details (firstName, lastName, phone, email)
   */
  async updateUser(id, payload) {
    return await request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Toggle or set user status (ACTIVE | SUSPENDED)
   */
  async updateUserStatus(id, status) {
    return await request(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  /**
   * Grant or revoke VIP tier
   */
  async updateUserVip(id, { isVip, days = 30, planName } = {}) {
    return await request(`/${id}/vip`, {
      method: 'PATCH',
      body: JSON.stringify({ isVip, days, planName })
    });
  },

  /**
   * Delete user permanently
   */
  async deleteUser(id) {
    return await request(`/${id}`, {
      method: 'DELETE'
    });
  }
};
