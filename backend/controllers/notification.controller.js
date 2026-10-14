import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { sendFcmPush } from '../services/firebase.service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map notification type → user settings field so we can honour the user's
 * per-type opt-in before delivering (used by sendNotification).
 */
const TYPE_TO_SETTING = {
  NEW_EPISODE: 'newEpisodes',
  NEW_RELEASE: 'newReleases',
  RECOMMENDATION: 'recommendations',
  SYSTEM: null // SYSTEM notifications are always delivered
};

/**
 * Build a human-readable relative-time label identical to the UI grouping:
 *   "Today", "Yesterday", "2 Days Ago", etc.
 */
function relativeLabel(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

/**
 * Group a flat array of notification docs into date sections as seen on the
 * mobile screen: [{ label: "Today", notifications: [...] }, ...]
 */
function groupByDate(docs) {
  const groups = new Map();
  const now = new Date();

  docs.forEach((n) => {
    const d = new Date(n.createdAt);
    const diffDays = Math.floor((now - d) / 86400000);

    let label;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else label = `${diffDays} Days Ago`;

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({
      ...n.toJSON(),
      timeAgo: relativeLabel(n.createdAt)
    });
  });

  // Convert Map → sorted array (most-recent group first)
  return Array.from(groups.entries()).map(([label, notifications]) => ({
    label,
    notifications
  }));
}

/**
 * Sample notification templates matching the mobile app reference UI
 */
export function getSampleNotifications(userId) {
  const now = Date.now();
  return [
    {
      userId,
      type: 'NEW_EPISODE',
      title: 'New Episode Available',
      body: 'Episode 09 of The Last Promise is now available.',
      imageUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&q=80',
      deepLink: '/watch/the-last-promise/ep-9',
      isRead: false,
      createdAt: new Date(now - 12 * 60 * 1000) // 12 min ago
    },
    {
      userId,
      type: 'NEW_RELEASE',
      title: 'New Release',
      body: 'A new drama has arrived. Discover Dangerous Love.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80',
      deepLink: '/series/dangerous-love',
      isRead: false,
      createdAt: new Date(now - 12 * 60 * 1000) // 12 min ago
    },
    {
      userId,
      type: 'NEW_EPISODE',
      title: 'New Episode Available',
      body: 'Episode 09 of The Last Promise is now available.',
      imageUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&q=80',
      deepLink: '/watch/the-last-promise/ep-9',
      isRead: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      userId,
      type: 'NEW_RELEASE',
      title: 'New Release',
      body: 'A new drama has arrived. Discover Dangerous Love.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&q=80',
      deepLink: '/series/dangerous-love',
      isRead: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];
}

// ---------------------------------------------------------------------------
// 1. GET /notifications  — Fetch user's notification list (paginated, grouped)
// ---------------------------------------------------------------------------
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const page = Math.max(0, parseInt(req.query.page, 10) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = page * limit;

    // Optional filter: ?type=NEW_EPISODE  or  ?unreadOnly=true
    const filter = { userId };
    if (req.query.type) filter.type = req.query.type.toUpperCase();
    if (req.query.unreadOnly === 'true') filter.isRead = false;

    let [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false })
    ]);

    // If no notifications exist yet and no filter applied,
    // auto-seed sample UI notifications if user hasn't explicitly cleared them
    if (total === 0 && !req.query.type && !req.query.unreadOnly && req.query.autoSeed !== 'false') {
      const user = await User.findById(userId).select('settings.notificationsCleared');
      if (!user?.settings?.notificationsCleared) {
        const sampleItems = getSampleNotifications(userId);
        await Notification.insertMany(sampleItems);

        [notifications, total, unreadCount] = await Promise.all([
          Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
          Notification.countDocuments(filter),
          Notification.countDocuments({ userId, isRead: false })
        ]);
      }
    }

    const formattedList = notifications.map((n) => ({
      ...n.toJSON(),
      timeAgo: relativeLabel(n.createdAt)
    }));

    const grouped = groupByDate(notifications);

    return ApiResponse.success(res, 'Notifications fetched successfully', {
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: (page + 1) * limit < total,
        hasPrevPage: page > 0
      },
      notifications: formattedList,
      groups: grouped
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 2. GET /notifications/unread-count  — Quick badge count for app icon
// ---------------------------------------------------------------------------
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.userId,
      isRead: false
    });

    return ApiResponse.success(res, 'Unread count fetched', { unreadCount: count });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 3. PATCH /notifications/:id/read  — Mark a single notification as read
// ---------------------------------------------------------------------------
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError('Notification not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    return ApiResponse.success(res, 'Notification marked as read', {
      notification: { ...notification.toJSON(), timeAgo: relativeLabel(notification.createdAt) }
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 4. PATCH /notifications/read-all  — Mark ALL user notifications as read
// ---------------------------------------------------------------------------
export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );

    return ApiResponse.success(res, 'All notifications marked as read', {
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 5. DELETE /notifications/:id  — Delete a single notification
// ---------------------------------------------------------------------------
export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!notification) {
      return next(new AppError('Notification not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    return ApiResponse.success(res, 'Notification deleted successfully');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 6. DELETE /notifications/clear-all  — Delete all notifications for the user
// ---------------------------------------------------------------------------
export const clearAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.userId });
    await User.findByIdAndUpdate(req.userId, { 'settings.notificationsCleared': true });

    return ApiResponse.success(res, 'All notifications cleared', {
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return next(error);
  }
};

// Notification configuration matching the mobile app "Notification Settings" screen
export const NOTIFICATION_CONFIG = [
  {
    key: 'newEpisodes',
    title: 'New episodes',
    description: 'Get notified when a series continues',
    default: true
  },
  {
    key: 'newReleases',
    title: 'New releases',
    description: 'Discover newly added series',
    default: true
  },
  {
    key: 'recommendations',
    title: 'Recommendations',
    description: 'Personalized stories for you',
    default: false
  }
];

// ---------------------------------------------------------------------------
// 7. GET /notifications/settings  — Get user notification preference toggles
//    Returns both key-value settings object and structured alerts array
//    matching the mobile app "Notification Settings" screen.
// ---------------------------------------------------------------------------
export const getNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;
    const user = await User.findById(userId).select('settings.notifications');
    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const saved = user.settings?.notifications || {};
    const settings = {
      newEpisodes: typeof saved.newEpisodes === 'boolean' ? saved.newEpisodes : true,
      newReleases: typeof saved.newReleases === 'boolean' ? saved.newReleases : true,
      recommendations: typeof saved.recommendations === 'boolean' ? saved.recommendations : false
    };

    const alerts = NOTIFICATION_CONFIG.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      enabled: settings[item.key]
    }));

    return ApiResponse.success(res, 'Notification settings fetched successfully', {
      title: 'Notification Settings',
      subtitle: 'Manage your alert preferences',
      category: 'ALERTS',
      settings,
      alerts
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 8. PUT & PATCH /notifications/settings  — Update notification preferences
//    Supports batch update, key-value toggle, nested settings, or alerts array.
// ---------------------------------------------------------------------------
export const updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;
    const { key, value, enabled, settings: nestedSettings, alerts } = req.body;
    let { newEpisodes, newReleases, recommendations } = req.body;

    // Handle nested settings object e.g. { settings: { newEpisodes: true } }
    if (nestedSettings && typeof nestedSettings === 'object') {
      if (typeof nestedSettings.newEpisodes === 'boolean') newEpisodes = nestedSettings.newEpisodes;
      if (typeof nestedSettings.newReleases === 'boolean') newReleases = nestedSettings.newReleases;
      if (typeof nestedSettings.recommendations === 'boolean') recommendations = nestedSettings.recommendations;
    }

    // Handle alerts array e.g. { alerts: [{ key: 'newEpisodes', enabled: false }] }
    if (Array.isArray(alerts)) {
      alerts.forEach((item) => {
        if (item.key && typeof item.enabled === 'boolean') {
          if (item.key === 'newEpisodes') newEpisodes = item.enabled;
          if (item.key === 'newReleases') newReleases = item.enabled;
          if (item.key === 'recommendations') recommendations = item.enabled;
        }
      });
    }

    // Handle single key-value update e.g. { key: 'newEpisodes', enabled: false } or { key: 'newEpisodes', value: false }
    if (key && (typeof value === 'boolean' || typeof enabled === 'boolean')) {
      const boolVal = typeof enabled === 'boolean' ? enabled : value;
      if (key === 'newEpisodes') newEpisodes = boolVal;
      if (key === 'newReleases') newReleases = boolVal;
      if (key === 'recommendations') recommendations = boolVal;
    }

    // Build the update object — only include fields that were actually sent
    const updateFields = {};
    if (typeof newEpisodes === 'boolean')
      updateFields['settings.notifications.newEpisodes'] = newEpisodes;
    if (typeof newReleases === 'boolean')
      updateFields['settings.notifications.newReleases'] = newReleases;
    if (typeof recommendations === 'boolean')
      updateFields['settings.notifications.recommendations'] = recommendations;

    if (Object.keys(updateFields).length === 0) {
      return next(
        new AppError(
          'Provide at least one setting to update (newEpisodes, newReleases, or recommendations).',
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: 'settings.notifications' }
    );

    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const current = user.settings?.notifications || {};
    const updatedSettings = {
      newEpisodes: typeof current.newEpisodes === 'boolean' ? current.newEpisodes : true,
      newReleases: typeof current.newReleases === 'boolean' ? current.newReleases : true,
      recommendations: typeof current.recommendations === 'boolean' ? current.recommendations : false
    };

    const updatedAlerts = NOTIFICATION_CONFIG.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      enabled: updatedSettings[item.key]
    }));

    return ApiResponse.success(res, 'Notification settings updated successfully', {
      title: 'Notification Settings',
      subtitle: 'Manage your alert preferences',
      settings: updatedSettings,
      alerts: updatedAlerts
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 8b. PATCH /notifications/settings/:key/toggle (or POST /notifications/settings/toggle)
//     Toggle a single notification setting switch on/off
// ---------------------------------------------------------------------------
export const toggleNotificationSetting = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;
    const targetKey = req.params.key || req.body.key;
    const validKeys = ['newEpisodes', 'newReleases', 'recommendations'];

    if (!targetKey || !validKeys.includes(targetKey)) {
      return next(
        new AppError(
          `Invalid notification key '${targetKey}'. Must be one of: ${validKeys.join(', ')}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    const user = await User.findById(userId).select('settings.notifications');
    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const currentVal = user.settings?.notifications?.[targetKey] !== undefined
      ? user.settings.notifications[targetKey]
      : (targetKey === 'recommendations' ? false : true);

    const explicitVal = typeof req.body.enabled === 'boolean'
      ? req.body.enabled
      : (typeof req.body.value === 'boolean' ? req.body.value : !currentVal);

    user.settings = user.settings || {};
    user.settings.notifications = user.settings.notifications || {};
    user.settings.notifications[targetKey] = explicitVal;
    user.markModified('settings');
    await user.save();

    const updatedSettings = {
      newEpisodes: typeof user.settings.notifications.newEpisodes === 'boolean' ? user.settings.notifications.newEpisodes : true,
      newReleases: typeof user.settings.notifications.newReleases === 'boolean' ? user.settings.notifications.newReleases : true,
      recommendations: typeof user.settings.notifications.recommendations === 'boolean' ? user.settings.notifications.recommendations : false
    };

    const updatedAlerts = NOTIFICATION_CONFIG.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      enabled: updatedSettings[item.key]
    }));

    return ApiResponse.success(res, `Notification setting '${targetKey}' set to ${explicitVal}`, {
      key: targetKey,
      enabled: explicitVal,
      settings: updatedSettings,
      alerts: updatedAlerts
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 8c. POST /notifications/settings/reset
//     Reset all notification preferences to platform defaults
// ---------------------------------------------------------------------------
export const resetNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.userId || req.user?._id;
    const defaultSettings = {
      newEpisodes: true,
      newReleases: true,
      recommendations: false
    };

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'settings.notifications': defaultSettings
        }
      },
      { new: true, select: 'settings.notifications' }
    );

    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const alerts = NOTIFICATION_CONFIG.map((item) => ({
      key: item.key,
      title: item.title,
      description: item.description,
      enabled: defaultSettings[item.key]
    }));

    return ApiResponse.success(res, 'Notification settings reset to defaults successfully', {
      settings: defaultSettings,
      alerts
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 9. POST /notifications/register-device  — Save FCM / push token to user
//    Call this on app launch (or whenever the OS issues a new token)
// ---------------------------------------------------------------------------
export const registerDeviceToken = async (req, res, next) => {
  try {
    const rawToken = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.fcm_token;

    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 10) {
      return next(
        new AppError('A valid fcmToken is required.', 400, ERROR_CODES.VALIDATION_ERROR)
      );
    }

    const token = rawToken.trim();

    // If request is from an authenticated user, link token to account
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { fcmTokens: token }
      });
    }

    return ApiResponse.success(res, 'Device registered for push notifications', {
      fcmToken: token,
      userId: req.userId || null
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 10. DELETE /notifications/unregister-device  — Remove FCM token on logout
// ---------------------------------------------------------------------------
export const unregisterDeviceToken = async (req, res, next) => {
  try {
    const rawToken = req.body.fcmToken || req.body.token || req.body.deviceToken || req.body.fcm_token;

    if (!rawToken) {
      return next(
        new AppError('fcmToken is required to unregister device.', 400, ERROR_CODES.VALIDATION_ERROR)
      );
    }

    const token = rawToken.trim();

    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        $pull: { fcmTokens: token }
      });
    }

    return ApiResponse.success(res, 'Device unregistered from push notifications', {
      fcmToken: token
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 11. POST /notifications/send  — Admin / System: create & send a notification to a user
//     (Defaults userId to req.userId if not provided)
// ---------------------------------------------------------------------------
export const sendNotification = async (req, res, next) => {
  try {
    const { type = 'SYSTEM', title, body, imageUrl, deepLink, contentId } = req.body;
    const userId = req.body.userId || req.userId;

    // Basic validation
    if (!userId || !title || !body) {
      return next(
        new AppError(
          'userId, title, and body are required to send a notification.',
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    const upperType = type.toUpperCase();
    const VALID_TYPES = ['NEW_EPISODE', 'NEW_RELEASE', 'RECOMMENDATION', 'SYSTEM'];
    if (!VALID_TYPES.includes(upperType)) {
      return next(
        new AppError(
          `Invalid notification type. Must be one of: ${VALID_TYPES.join(', ')}`,
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    // Check if the target user has opted out of this notification type
    const targetUser = await User.findById(userId).select('settings.notifications fcmTokens status');
    if (!targetUser || targetUser.status === 'DELETED') {
      return next(new AppError('Target user not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const settingKey = TYPE_TO_SETTING[upperType];
    if (settingKey && targetUser.settings?.notifications?.[settingKey] === false) {
      return ApiResponse.success(res, 'Notification skipped — user has opted out of this type', {
        delivered: false,
        reason: 'USER_OPT_OUT'
      });
    }

    // Persist notification in DB
    const notification = await Notification.create({
      userId,
      type: upperType,
      title: title.trim(),
      body: body.trim(),
      imageUrl: imageUrl || null,
      deepLink: deepLink || null,
      contentId: contentId || null,
      sentBy: req.userId // admin/sender ID
    });

    // -------------------------------------------------------------------
    // FCM Push delivery to user's registered devices
    // -------------------------------------------------------------------
    const fcmTokens = targetUser.fcmTokens || [];
    let pushResult = null;
    if (fcmTokens.length > 0) {
      pushResult = await sendFcmPush(fcmTokens, {
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl || undefined,
        deepLink: deepLink || undefined,
        data: {
          type: upperType,
          contentId: contentId ? String(contentId) : '',
          notificationId: String(notification._id)
        }
      });
    }

    return ApiResponse.success(res, 'Notification sent successfully', {
      delivered: true,
      notification: { ...notification.toJSON(), timeAgo: relativeLabel(notification.createdAt) },
      push: pushResult
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 12. POST /notifications/seed  — Seed/reset sample notifications for testing
// ---------------------------------------------------------------------------
export const seedNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    if (req.query.reset === 'true') {
      await Notification.deleteMany({ userId });
    }
    await User.findByIdAndUpdate(userId, { 'settings.notificationsCleared': false });
    const sampleItems = getSampleNotifications(userId);
    const created = await Notification.insertMany(sampleItems);

    return ApiResponse.success(res, 'Sample notifications seeded successfully', {
      count: created.length,
      sampleNotifications: created
    });
  } catch (error) {
    return next(error);
  }
};

