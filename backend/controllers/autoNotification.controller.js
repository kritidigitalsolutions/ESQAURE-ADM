import { AutoNotificationTrigger } from '../models/AutoNotificationTrigger.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { sendFcmPush } from '../services/firebase.service.js';

export const DEFAULT_AUTO_TRIGGERS = [
  {
    triggerKey: 'WELCOME_SIGNUP',
    name: 'Welcome to E² Stories',
    description: 'Dispatched automatically to mobile devices when a new viewer joins the platform',
    category: 'USER',
    triggerEvent: 'USER_REGISTERED',
    title: '🎬 Welcome to E² Stories, {{userName}}!',
    body: 'Dive into trending vertical web series and original micro-dramas. Start watching now!',
    targetAudience: 'New Users',
    deepLink: '/home',
    delayMinutes: 0,
    isEnabled: true,
    isSystem: true
  },
  {
    triggerKey: 'SUBSCRIPTION_SUCCESS',
    name: 'VIP Subscription Activated',
    description: 'Dispatched automatically when a user purchases a VIP pass or trial mandate',
    category: 'BILLING',
    triggerEvent: 'PAYMENT_SUCCESS',
    title: '👑 VIP Unlocked: Welcome to Premium!',
    body: 'Your {{planName}} is now active. Enjoy 100% ad-free streaming and all unlocked episodes!',
    targetAudience: 'Subscribers Only',
    deepLink: '/vip',
    delayMinutes: 0,
    isEnabled: true,
    isSystem: true
  },
  {
    triggerKey: 'NEW_EPISODE_RELEASE',
    name: 'New Episode Release',
    description: 'Dispatched automatically when a new series or episode is published to the catalog',
    category: 'CONTENT',
    triggerEvent: 'CONTENT_RELEASE',
    title: '🔥 New Episode Dropped: Watch Now!',
    body: 'The brand-new episode of {{dramaTitle}} is now live. Tap to see what happens next!',
    targetAudience: 'All Users',
    deepLink: '/dramas',
    delayMinutes: 0,
    isEnabled: true,
    isSystem: true
  },
  {
    triggerKey: 'RENEWAL_REMINDER',
    name: 'Subscription Expiration Warning',
    description: 'Dispatched 24-48 hours before a user\'s VIP pass expires to prompt renewal',
    category: 'BILLING',
    triggerEvent: 'RENEWAL_REMINDER',
    title: '⚡ Your VIP Pass Expires Soon',
    body: 'Don\'t let the binge stop! Renew your {{planName}} now to keep non-stop ad-free episodes.',
    targetAudience: 'Expiring Users',
    deepLink: '/vip',
    delayMinutes: 0,
    isEnabled: true,
    isSystem: true
  },
  {
    triggerKey: 'INACTIVE_WINBACK',
    name: 'Inactive Viewer Comeback',
    description: 'Dispatched to users who haven\'t opened the app in 7+ days to re-engage them',
    category: 'ENGAGEMENT',
    triggerEvent: 'INACTIVE_WINBACK',
    title: '🍿 We Miss You on E² Stories!',
    body: 'New romantic, thriller, and drama episodes were added while you were away. Watch free!',
    targetAudience: 'Inactive 7+ Days',
    deepLink: '/home',
    delayMinutes: 0,
    isEnabled: true,
    isSystem: true
  },
  {
    triggerKey: 'PAYMENT_FAILED',
    name: 'Payment Failure Alert',
    description: 'Dispatched if auto-renew debit fails or UPI checkout is unsuccessful',
    category: 'BILLING',
    triggerEvent: 'PAYMENT_FAILED',
    title: '⚠️ Action Required: Subscription Payment Failed',
    body: 'We couldn\'t process your renewal payment. Tap here to update your payment method.',
    targetAudience: 'Subscribers Only',
    deepLink: '/vip',
    delayMinutes: 0,
    isEnabled: false,
    isSystem: true
  }
];

/**
 * Ensure default system triggers are seeded in MongoDB
 */
async function ensureDefaultTriggersSeeded() {
  const count = await AutoNotificationTrigger.countDocuments();
  if (count === 0) {
    await AutoNotificationTrigger.insertMany(DEFAULT_AUTO_TRIGGERS);
  }
}

/**
 * GET /api/v1/notifications/admin/auto-triggers
 * List all automated notification triggers with audience statistics
 */
export const getAutoTriggers = async (req, res, next) => {
  try {
    await ensureDefaultTriggersSeeded();
    const triggers = await AutoNotificationTrigger.find().sort({ isSystem: -1, createdAt: 1 });

    const totalTriggers = triggers.length;
    const activeTriggers = triggers.filter((t) => t.isEnabled).length;
    const totalDispatched = triggers.reduce((sum, t) => sum + (t.totalTriggeredCount || 0), 0);

    return ApiResponse.success(res, 'Auto-send notification triggers fetched', {
      triggers,
      stats: {
        totalTriggers,
        activeTriggers,
        totalDispatched
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/notifications/admin/auto-triggers
 * Create a new custom automated notification trigger
 */
export const createAutoTrigger = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category = 'USER',
      triggerEvent = 'CUSTOM',
      title,
      body,
      targetAudience = 'All Users',
      deepLink = '/home',
      imageUrl = '',
      delayMinutes = 0,
      isEnabled = true
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Trigger name is required', 400));
    }
    if (!title || !title.trim()) {
      return next(new AppError('Notification title is required', 400));
    }
    if (!body || !body.trim()) {
      return next(new AppError('Notification body copy is required', 400));
    }

    const triggerKey = `CUSTOM_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const trigger = await AutoNotificationTrigger.create({
      triggerKey,
      name: name.trim(),
      description: description ? description.trim() : '',
      category,
      triggerEvent,
      title: title.trim(),
      body: body.trim(),
      targetAudience,
      deepLink: deepLink.trim() || '/home',
      imageUrl: imageUrl.trim(),
      delayMinutes: Number(delayMinutes) || 0,
      isEnabled: Boolean(isEnabled),
      isSystem: false
    });

    return ApiResponse.created(res, 'Custom auto trigger created successfully', {
      trigger
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/v1/notifications/admin/auto-triggers/:id
 * Update auto trigger template, deepLink, timing, and audience
 */
export const updateAutoTrigger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      title,
      body,
      targetAudience,
      deepLink,
      imageUrl,
      delayMinutes,
      isEnabled,
      category
    } = req.body;

    const trigger = await AutoNotificationTrigger.findById(id);
    if (!trigger) {
      return next(new AppError('Auto notification trigger not found', 404));
    }

    if (name !== undefined) trigger.name = name.trim();
    if (description !== undefined) trigger.description = description.trim();
    if (title !== undefined) trigger.title = title.trim();
    if (body !== undefined) trigger.body = body.trim();
    if (targetAudience !== undefined) trigger.targetAudience = targetAudience;
    if (deepLink !== undefined) trigger.deepLink = deepLink.trim();
    if (imageUrl !== undefined) trigger.imageUrl = imageUrl.trim();
    if (delayMinutes !== undefined) trigger.delayMinutes = Number(delayMinutes) || 0;
    if (isEnabled !== undefined) trigger.isEnabled = Boolean(isEnabled);
    if (category !== undefined) trigger.category = category;

    await trigger.save();

    return ApiResponse.success(res, 'Auto notification trigger updated', {
      trigger
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/notifications/admin/auto-triggers/:id/toggle
 * Toggle active status of an automated trigger rule
 */
export const toggleAutoTrigger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trigger = await AutoNotificationTrigger.findById(id);
    if (!trigger) {
      return next(new AppError('Auto notification trigger not found', 404));
    }

    trigger.isEnabled = !trigger.isEnabled;
    await trigger.save();

    return ApiResponse.success(res, `Trigger ${trigger.isEnabled ? 'activated' : 'disabled'} successfully`, {
      trigger
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/notifications/admin/auto-triggers/:id
 * Delete a custom automated trigger (System default triggers are protected)
 */
export const deleteAutoTrigger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trigger = await AutoNotificationTrigger.findById(id);
    if (!trigger) {
      return next(new AppError('Trigger not found', 404));
    }
    if (trigger.isSystem) {
      return next(new AppError('System default triggers cannot be deleted. You can disable them instead.', 400));
    }

    await AutoNotificationTrigger.findByIdAndDelete(id);

    return ApiResponse.success(res, 'Custom auto trigger removed successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/notifications/admin/auto-triggers/:id/test
 * Send an immediate live test push of this automated trigger
 */
export const testSendAutoTrigger = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trigger = await AutoNotificationTrigger.findById(id);
    if (!trigger) {
      return next(new AppError('Trigger not found', 404));
    }

    // Collect tokens from users
    const usersWithTokens = await User.find({
      status: { $ne: 'DELETED' },
      fcmTokens: { $exists: true, $ne: [] }
    }).select('fcmTokens firstName lastName phoneNumber');

    const allTokens = [];
    usersWithTokens.forEach((u) => {
      if (Array.isArray(u.fcmTokens)) {
        allTokens.push(...u.fcmTokens);
      }
    });

    const uniqueTokens = [...new Set(allTokens)];

    // Interpolate sample data
    const previewTitle = trigger.title
      .replace(/{{userName}}/g, 'Valued Viewer')
      .replace(/{{planName}}/g, '1 Month VIP Pass')
      .replace(/{{dramaTitle}}/g, 'Love in the City');

    const previewBody = trigger.body
      .replace(/{{userName}}/g, 'Valued Viewer')
      .replace(/{{planName}}/g, '1 Month VIP Pass')
      .replace(/{{dramaTitle}}/g, 'Love in the City');

    let pushResult = { deliveredCount: 0, sentCount: 0 };
    if (uniqueTokens.length > 0) {
      pushResult = await sendFcmPush(uniqueTokens, {
        title: previewTitle,
        body: previewBody,
        imageUrl: trigger.imageUrl || undefined,
        deepLink: trigger.deepLink || '/home',
        data: {
          triggerKey: trigger.triggerKey,
          isAutoTest: 'true'
        }
      });
    }

    trigger.totalTriggeredCount = (trigger.totalTriggeredCount || 0) + 1;
    trigger.lastTriggeredAt = new Date();
    trigger.lastDeliveredCount = pushResult.deliveredCount || uniqueTokens.length;
    await trigger.save();

    return ApiResponse.success(res, `Test notification dispatched for ${trigger.name}`, {
      previewTitle,
      previewBody,
      sentCount: uniqueTokens.length,
      deliveredCount: pushResult.deliveredCount || uniqueTokens.length
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Helper to dispatch an automated notification trigger from anywhere in backend
 * E.g. when a user completes registration or buys a subscription.
 */
export const dispatchAutoNotification = async (triggerKey, { user, data = {} } = {}) => {
  try {
    const trigger = await AutoNotificationTrigger.findOne({ triggerKey, isEnabled: true });
    if (!trigger) return null;

    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user?.name || 'Viewer';
    const planName = data.planName || user?.vipPlan || 'VIP Pass';
    const dramaTitle = data.dramaTitle || 'Trending Series';

    const formattedTitle = trigger.title
      .replace(/{{userName}}/g, userName)
      .replace(/{{planName}}/g, planName)
      .replace(/{{dramaTitle}}/g, dramaTitle);

    const formattedBody = trigger.body
      .replace(/{{userName}}/g, userName)
      .replace(/{{planName}}/g, planName)
      .replace(/{{dramaTitle}}/g, dramaTitle);

    // 1. Create in-app notification if userId exists
    if (user?._id) {
      await Notification.create({
        userId: user._id,
        type: trigger.category === 'CONTENT' ? 'NEW_RELEASE' : 'SYSTEM',
        title: formattedTitle,
        body: formattedBody,
        deepLink: trigger.deepLink || '/home',
        imageUrl: trigger.imageUrl || null
      }).catch((e) => console.warn('Could not create in-app notification doc:', e.message));
    }

    // 2. Dispatch FCM Push if user has device tokens
    const tokens = user?.fcmTokens || [];
    let pushResult = { deliveredCount: 0 };
    if (tokens.length > 0) {
      pushResult = await sendFcmPush(tokens, {
        title: formattedTitle,
        body: formattedBody,
        deepLink: trigger.deepLink,
        imageUrl: trigger.imageUrl || undefined,
        data: {
          triggerKey,
          autoGenerated: 'true',
          ...data
        }
      });
    }

    // 3. Update stats
    trigger.totalTriggeredCount = (trigger.totalTriggeredCount || 0) + 1;
    trigger.lastTriggeredAt = new Date();
    trigger.lastDeliveredCount = pushResult.deliveredCount || (tokens.length > 0 ? tokens.length : 1);
    await trigger.save();

    return trigger;
  } catch (err) {
    console.error(`❌ [AutoNotification] Failed to dispatch ${triggerKey}:`, err.message);
    return null;
  }
};
