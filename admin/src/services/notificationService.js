import { subscriptionService } from './subscriptionService';
import { dramaService } from './dramaService';
import { userService } from './userService';
import { createApiRequest } from './apiClient';

const request = createApiRequest('/api/v1/notifications', 'http://localhost:5001/api/v1/notifications');


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
  },

  /**
   * Fetch incoming notifications and activity alerts that came to the admin
   * Excludes outbound push broadcasts. Combines:
   * 1. New user registrations (User Signups)
   * 2. Real payment transactions (Billing)
   * 3. Catalog & Series releases (Content)
   * 4. In-app Announcements / System Notices
   */
  async getAllAdminAlerts({ limit = 30 } = {}) {
    const [announcementsRes, txRes, dramasRes, usersRes] = await Promise.allSettled([
      this.getAnnouncements(),
      subscriptionService.getTransactions({ limit }),
      dramaService.getAdminDramas(),
      userService.getUsers({ limit: 40 })
    ]);

    const items = [];

    // 1. Live In-App Notices / Announcements
    if (announcementsRes.status === 'fulfilled' && announcementsRes.value?.announcements) {
      announcementsRes.value.announcements.forEach((a) => {
        const id = `ann-${a._id || a.id}`;
        items.push({
          id,
          rawId: a._id || a.id,
          category: 'ANNOUNCEMENT',
          type: 'ANNOUNCEMENT',
          title: a.title || 'System Announcement',
          message: a.body || 'In-app notification sent to viewer inboxes.',
          target: a.target || 'All Active Users',
          priority: a.priority || 'Normal',
          isActive: a.isActive !== false,
          createdAt: a.createdAt,
          targetTab: 'app_notifications',
          actionLabel: 'In-App Notice'
        });
      });
    }

    // 2. Incoming New User Signups / Registrations (Came to Admin)
    if (usersRes.status === 'fulfilled' && usersRes.value?.users) {
      usersRes.value.users.forEach((u) => {
        const id = `usr-${u.id || u._id}`;
        const displayName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.phoneNumber || 'New Viewer';
        const contact = u.email || (u.phoneNumber ? `${u.countryCode || '+91'} ${u.phoneNumber}` : '');
        const tier = u.isVip ? 'VIP Subscriber' : 'Standard Viewer';

        items.push({
          id,
          rawId: u.id || u._id,
          category: 'USER',
          type: 'NEW_USER',
          title: `New User: ${displayName}`,
          message: `${displayName} registered on the platform as ${tier}${contact ? ` (${contact})` : ''}.`,
          user: displayName,
          target: tier,
          createdAt: u.createdAt,
          targetTab: 'users',
          actionLabel: 'View User'
        });
      });
    }

    // 3. Live Transactions (Billing & Payments to Admin)
    if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
      txRes.value.transactions.forEach((t) => {
        const id = `tx-${t.id || t._id}`;
        items.push({
          id,
          rawId: t.id || t._id,
          category: 'BILLING',
          type: 'TRANSACTION',
          title: t.status === 'SUCCESS' ? 'Subscription Payment Success' : `Payment Status: ${t.status || 'Pending'}`,
          message: `${t.user || 'Viewer'} purchased ${t.plan || 'Plan'} (${t.amount}) via ${t.method || 'UPI'}.`,
          amount: t.amount,
          status: t.status,
          user: t.user,
          createdAt: t.createdAt,
          targetTab: 'transactions',
          actionLabel: 'View Transaction'
        });
      });
    }

    // 4. Live Dramas / Catalog series updates
    if (dramasRes.status === 'fulfilled' && dramasRes.value?.dramas) {
      dramasRes.value.dramas.forEach((d) => {
        const id = `drm-${d._id || d.id}`;
        items.push({
          id,
          rawId: d._id || d.id,
          category: 'CONTENT',
          type: 'CATALOG',
          title: `Series: ${d.title}`,
          message: `Catalog status: ${d.status || 'PUBLISHED'} with ${d.totalEpisodes || (d.episodes ? d.episodes.length : 0)} episodes.`,
          status: d.status,
          createdAt: d.updatedAt || d.createdAt,
          targetTab: 'dramas',
          actionLabel: 'Open Library'
        });
      });
    }

    // Sort newest first
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return items;
  },

  /**
   * Fetch all automated notification triggers
   */
  async getAutoTriggers() {
    return await request('/admin/auto-triggers', { method: 'GET' });
  },

  /**
   * Create a new custom automated notification trigger
   */
  async createAutoTrigger(payload) {
    return await request('/admin/auto-triggers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Update an existing automated trigger
   */
  async updateAutoTrigger(id, payload) {
    return await request(`/admin/auto-triggers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Toggle automated trigger active status
   */
  async toggleAutoTrigger(id) {
    return await request(`/admin/auto-triggers/${id}/toggle`, {
      method: 'PATCH'
    });
  },

  /**
   * Delete custom automated trigger
   */
  async deleteAutoTrigger(id) {
    return await request(`/admin/auto-triggers/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Dispatch test push for automated trigger
   */
  async testSendAutoTrigger(id) {
    return await request(`/admin/auto-triggers/${id}/test`, {
      method: 'POST'
    });
  }
};

