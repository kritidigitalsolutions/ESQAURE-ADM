import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/subscriptions/admin', 'http://localhost:5001/api/v1/subscriptions/admin');


export const subscriptionService = {
  /**
   * Fetch overview monetization KPIs & subscriber metrics
   */
  async getOverview() {
    return await request('/overview', { method: 'GET' });
  },

  /**
   * Fetch time-series revenue analytics (today, monthly, yearly)
   */
  async getRevenueAnalytics() {
    return await request('/revenue-analytics', { method: 'GET' });
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
