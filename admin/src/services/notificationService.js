const API_BASE = '/api/v1/notifications';
const FALLBACK_BASE = 'http://localhost:5001/api/v1/notifications';

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

export const notificationService = {
  /**
   * Fetch push notification campaigns history and real audience statistics
   */
  async getCampaigns() {
    return await request('/admin/campaigns', { method: 'GET' });
  },

  /**
   * Broadcast a push notification via Firebase FCM and save campaign
   */
  async broadcastPush(payload) {
    return await request('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Fetch all in-app announcements
   */
  async getAnnouncements() {
    return await request('/admin/announcements', { method: 'GET' });
  },

  /**
   * Create and publish an in-app announcement
   */
  async createAnnouncement(payload) {
    return await request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Delete an announcement by ID
   */
  async deleteAnnouncement(id) {
    return await request(`/admin/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Toggle announcement active status
   */
  async toggleAnnouncement(id) {
    return await request(`/admin/announcements/${id}/toggle`, {
      method: 'PATCH'
    });
  }
};
