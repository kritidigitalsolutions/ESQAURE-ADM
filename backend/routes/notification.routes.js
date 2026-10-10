import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
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

const router = Router();

// ── Admin Panel Routes (Push Campaigns & Announcements) ─────────────────────
router.get('/admin/campaigns', getCampaigns);
router.post('/admin/broadcast', broadcastPush);
router.get('/admin/announcements', getAnnouncements);
router.post('/admin/announcements', createAnnouncement);
router.delete('/admin/announcements/:id', deleteAnnouncement);
router.patch('/admin/announcements/:id/toggle', toggleAnnouncement);

// ── Device / Push Token Management (supports both authenticated & guest app launches) ──
// POST   /api/v1/notifications/register-device   → Save FCM token
router.post('/register-device', optionalAuthenticate, registerDeviceToken);

// DELETE /api/v1/notifications/unregister-device → Remove FCM token (on logout)
router.delete('/unregister-device', optionalAuthenticate, unregisterDeviceToken);

// ── Mobile App Protected Routes ─────────────────────────────────────────────
// The remaining mobile notification routes require a valid Bearer token
router.use(authenticate);

// ── Notification Settings (toggles screen) ────────────────────────────────
// GET  /api/v1/notifications/settings    → Get newEpisodes / newReleases / recommendations
router.get('/settings', getNotificationSettings);

// PUT  /api/v1/notifications/settings    → Update one or more toggles
router.put('/settings', updateNotificationSettings);

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
