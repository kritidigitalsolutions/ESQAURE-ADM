import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  toggleNotificationSetting,
  resetNotificationSettings,
  registerDeviceToken,
  unregisterDeviceToken,
  sendNotification,
  seedNotifications
} from '../controllers/notification.controller.js';
import {
  getCampaigns,
  broadcastPush,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  toggleAnnouncement
} from '../controllers/adminNotification.controller.js';
import {
  getAutoTriggers,
  createAutoTrigger,
  updateAutoTrigger,
  toggleAutoTrigger,
  deleteAutoTrigger,
  testSendAutoTrigger
} from '../controllers/autoNotification.controller.js';

const router = Router();

// ── Admin Panel Routes (Push Campaigns & Announcements) - Protected ────────
router.get('/admin/campaigns', verifyAdmin, getCampaigns);
router.post('/admin/broadcast', verifyAdmin, broadcastPush);
router.get('/admin/announcements', verifyAdmin, getAnnouncements);
router.post('/admin/announcements', verifyAdmin, createAnnouncement);
router.delete('/admin/announcements/:id', verifyAdmin, deleteAnnouncement);
router.patch('/admin/announcements/:id/toggle', verifyAdmin, toggleAnnouncement);

// ── Admin Auto-Send Notification Triggers - Protected ──────────────────────
router.get('/admin/auto-triggers', verifyAdmin, getAutoTriggers);
router.post('/admin/auto-triggers', verifyAdmin, createAutoTrigger);
router.put('/admin/auto-triggers/:id', verifyAdmin, updateAutoTrigger);
router.patch('/admin/auto-triggers/:id/toggle', verifyAdmin, toggleAutoTrigger);
router.delete('/admin/auto-triggers/:id', verifyAdmin, deleteAutoTrigger);
router.post('/admin/auto-triggers/:id/test', verifyAdmin, testSendAutoTrigger);


// ── Device / Push Token Management (supports both authenticated & guest app launches) ──
// POST   /api/v1/notifications/register-device   → Save FCM token
router.post('/register-device', optionalAuthenticate, registerDeviceToken);

// DELETE /api/v1/notifications/unregister-device → Remove FCM token (on logout)
router.delete('/unregister-device', optionalAuthenticate, unregisterDeviceToken);

// ── Mobile App Protected Routes ─────────────────────────────────────────────
// The remaining mobile notification routes require a valid Bearer token
router.use(authenticate);

// ── Notification Settings (Alert preferences screen) ───────────────────────
// GET   /api/v1/notifications/settings              → Get newEpisodes / newReleases / recommendations & UI metadata
router.get('/settings', getNotificationSettings);

// PUT   /api/v1/notifications/settings              → Update preferences (batch or single)
router.put('/settings', updateNotificationSettings);

// PATCH /api/v1/notifications/settings              → Partial update preferences
router.patch('/settings', updateNotificationSettings);

// POST  /api/v1/notifications/settings/toggle       → Toggle a specific preference (body: { key, enabled? })
router.post('/settings/toggle', toggleNotificationSetting);

// PATCH /api/v1/notifications/settings/:key/toggle  → Toggle specific preference by URL param
router.patch('/settings/:key/toggle', toggleNotificationSetting);

// POST  /api/v1/notifications/settings/reset        → Reset preferences to defaults
router.post('/settings/reset', resetNotificationSettings);

// ── Notification List & State (Static routes BEFORE parameterized /:id) ──────
// GET  /api/v1/notifications/unread-count → App icon badge count
router.get('/unread-count', getUnreadCount);

// PATCH /api/v1/notifications/read-all   → Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// DELETE /api/v1/notifications/clear-all → Delete all notifications for user
router.delete('/clear-all', clearAllNotifications);

// GET  /api/v1/notifications             → List notifications (paginated, date-grouped)
router.get('/', getNotifications);

// ── Parameterized routes (placed strictly after specific static routes) ─────
// PATCH /api/v1/notifications/:id/read   → Mark a single notification as read
router.patch('/:id/read', markAsRead);

// DELETE /api/v1/notifications/:id       → Delete a single notification
router.delete('/:id', deleteNotification);

// ── Admin / System: Send Notification ────────────────────────────────────
// POST /api/v1/notifications/seed  → Seed/reset sample notifications for testing
router.post('/seed', seedNotifications);

// POST /api/v1/notifications/send  → Create and (optionally) push to a user
router.post('/send', sendNotification);

export default router;
