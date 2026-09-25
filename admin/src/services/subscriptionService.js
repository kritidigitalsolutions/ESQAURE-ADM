const API_BASE = '/api/v1/subscriptions/admin';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/subscriptions/admin';

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

export const subscriptionService = {
  /**
   * Fetch overview monetization KPIs & subscriber metrics
   */
  async getOverview() {
    return await request('/overview', { method: 'GET' });
  },

  /**
   * Fetch all subscription plans with active subscriber counts
   */
  async getPlans() {
    return await request('/plans', { method: 'GET' });
  },

  /**
   * Create a new subscription plan
   */
  async createPlan(payload) {
    return await request('/plans', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update an existing subscription plan
   */
  async updatePlan(id, payload) {
    return await request(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete or archive a subscription plan
   */
  async deletePlan(id) {
    return await request(`/plans/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Fetch 7-Day trial settings
   */
  async getTrialSettings() {
    return await request('/trial-settings', { method: 'GET' });
  },

  /**
   * Update 7-Day trial settings
   */
  async updateTrialSettings(payload) {
    return await request('/trial-settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Fetch transaction ledger with optional search & filter
   */
  async getTransactions({ search = '', status = 'ALL', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await request(`/transactions${queryString}`, { method: 'GET' });
  },

  /**
   * Fetch active & trial subscribers
   */
  async getSubscribers({ search = '', status = 'ALL', page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('filter', status);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await request(`/subscribers${queryString}`, { method: 'GET' });
  },

  /**
   * Manual override: extend subscription or revoke access
   */
  async overrideSubscriberVip(id, { action, days = 30 }) {
    return await request(`/subscribers/${id}/override`, {
      method: 'PATCH',
      body: JSON.stringify({ action, days })
    });
  }
};
