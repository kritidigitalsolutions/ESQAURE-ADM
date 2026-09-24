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

// ---------------------------------------------------------------------------
// 7. GET /notifications/settings  — Get user notification preference toggles
// ---------------------------------------------------------------------------
export const getNotificationSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('settings.notifications');
    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    const prefs = user.settings?.notifications || {
      newEpisodes: true,
      newReleases: true,
      recommendations: false
    };

    return ApiResponse.success(res, 'Notification settings fetched', {
      settings: {
        newEpisodes: prefs.newEpisodes,
        newReleases: prefs.newReleases,
        recommendations: prefs.recommendations
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 8. PUT /notifications/settings  — Update notification preference toggles
//    Matches the 3 toggles on the "Notification Settings" screen
// ---------------------------------------------------------------------------
export const updateNotificationSettings = async (req, res, next) => {
  try {
    const { newEpisodes, newReleases, recommendations } = req.body;

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
          'Provide at least one setting to update: newEpisodes, newReleases, or recommendations.',
          400,
          ERROR_CODES.VALIDATION_ERROR
        )
      );
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true, select: 'settings.notifications' }
    );

    if (!user) {
      return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
    }

    return ApiResponse.success(res, 'Notification settings updated', {
      settings: user.settings.notifications
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
    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length < 10) {
      return next(
        new AppError('A valid fcmToken is required.', 400, ERROR_CODES.VALIDATION_ERROR)
      );
    }

    const token = fcmToken.trim();

    // Add token only if it is not already stored (prevent duplicates)
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { fcmTokens: token }
    });

    return ApiResponse.success(res, 'Device registered for push notifications', {
      fcmToken: token
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
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return next(
        new AppError('fcmToken is required to unregister device.', 400, ERROR_CODES.VALIDATION_ERROR)
      );
    }

    await User.findByIdAndUpdate(req.userId, {
      $pull: { fcmTokens: fcmToken.trim() }
    });

    return ApiResponse.success(res, 'Device unregistered from push notifications');
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 11. POST /notifications/send  — Admin: create & send a notification to a user
//     (You can call this from the admin panel or a background job)
// ---------------------------------------------------------------------------
export const sendNotification = async (req, res, next) => {
  try {
    const { userId, type, title, body, imageUrl, deepLink, contentId } = req.body;

    // Basic validation
    if (!userId || !type || !title || !body) {
      return next(
        new AppError(
          'userId, type, title, and body are required to send a notification.',
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

