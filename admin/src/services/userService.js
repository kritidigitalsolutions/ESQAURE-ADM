import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/users', 'http://localhost:5001/api/v1/users');


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
   * Fetch dynamic user activity telemetry derived from real database users and subscriptions
   */
  async getActivityAnalytics() {
    return await request('/admin/activity-analytics', { method: 'GET' });
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
   * Grant or revoke subscription tier
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
  },

  /**
   * Fetch all user account deletion requests
   */
  async getDeletionRequests() {
    return await request('/admin/deletion-requests', { method: 'GET' });
  },

  /**
   * Verify and delete user account
   */
  async verifyAndDeleteUser(id, payload = {}) {
    return await request(`/${id}/verify-delete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Reject user deletion request and restore active status
   */
  async rejectDeletionRequest(id, payload = {}) {
    return await request(`/${id}/reject-deletion`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
