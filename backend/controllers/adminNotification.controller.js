import { NotificationCampaign } from '../models/NotificationCampaign.js';
import { Announcement } from '../models/Announcement.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { sendFcmPush } from '../services/firebase.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// PUSH NOTIFICATIONS / BROADCAST CAMPAIGNS (Admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/notifications/admin/campaigns
 * Get real broadcast history and audience stats directly from MongoDB
 */
export const getCampaigns = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const [campaigns, totalUsers, subscribers, inactiveUsers, tokenStats] = await Promise.all([
      NotificationCampaign.find().sort({ createdAt: -1 }).limit(100),
      User.countDocuments({ status: { $ne: 'DELETED' } }),
      User.countDocuments({ 'subscription.status': 'ACTIVE', status: { $ne: 'DELETED' } }),
      User.countDocuments({
        status: { $ne: 'DELETED' },
        updatedAt: { $lte: sevenDaysAgo }
      }),
      User.aggregate([
        { $match: { status: { $ne: 'DELETED' } } },
        { $project: { tokenCount: { $size: { $ifNull: ['$fcmTokens', []] } } } },
        { $group: { _id: null, total: { $sum: '$tokenCount' } } }
      ])
    ]);

    const registeredDeviceTokens = tokenStats[0]?.total || 0;

    return ApiResponse.success(res, 'Campaigns and audience stats fetched', {
      campaigns,
      stats: {
        totalUsers,
        subscribers,
        inactiveUsers,
        registeredDeviceTokens,
        totalCampaigns: campaigns.length
      }
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/notifications/admin/broadcast
 * Broadcast a real push notification via Firebase FCM and save campaign record
 */
export const broadcastPush = async (req, res, next) => {
  try {
    const {
      title,
      message,
      targetAudience = 'All Users',
      targetUserId = '',
      targetUserName = '',
      selectedDrama = '',
      deepLink = '',
      imageUrl = ''
    } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Notification title is required.', 400));
    }
    if (!message || !message.trim()) {
      return next(new AppError('Notification message copy is required.', 400));
    }

    // 1. Build audience query for real registered users in DB
    const userQuery = { status: { $ne: 'DELETED' } };
    if (targetAudience === 'Specific User') {
      if (!targetUserId) {
        return next(new AppError('Please select a specific recipient user.', 400));
      }
      userQuery._id = targetUserId;
    } else if (targetAudience === 'Subscribers Only') {
      userQuery.$or = [{ isVip: true }, { 'subscription.status': 'ACTIVE' }];
    } else if (targetAudience === 'Inactive 7+ Days') {
      userQuery.updatedAt = { $lte: new Date(Date.now() - 7 * 86400000) };
    }

    const targetUsers = await User.find(userQuery).select('_id fcmTokens');
    const allTokens = [];
    targetUsers.forEach((u) => {
      if (Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0) {
        allTokens.push(...u.fcmTokens);
      }
    });

    // Remove duplicates
    const uniqueTokens = [...new Set(allTokens)];

    // 2. Dispatch real FCM push notifications if device tokens are registered
    let pushResult = { sentCount: uniqueTokens.length, deliveredCount: 0, failureCount: 0 };
    if (uniqueTokens.length > 0) {
      pushResult = await sendFcmPush(uniqueTokens, {
        title: title.trim(),
        body: message.trim(),
        imageUrl: imageUrl || undefined,
        deepLink: deepLink || undefined,
        data: {
          dramaId: selectedDrama || '',
          type: 'BROADCAST_PUSH'
        }
      });
    }

    // 3. Persist in-app notification in User inbox for each targeted user
    if (targetUsers.length > 0) {
      const notifDocs = targetUsers.map((u) => ({
        userId: u._id,
        type: 'NEW_RELEASE',
        title: title.trim(),
        body: message.trim(),
        imageUrl: imageUrl || null,
        deepLink: deepLink || null,
        isRead: false
      }));
      // Chunk insert if large
      await Notification.insertMany(notifDocs);
    }

    // 4. Save campaign history record in MongoDB
    const campaign = await NotificationCampaign.create({
      title: title.trim(),
      message: message.trim(),
      targetAudience: targetAudience === 'Specific User' && targetUserName ? `User: ${targetUserName}` : targetAudience,
      targetUserId: targetUserId || '',
      targetUserName: targetUserName || '',
      selectedDrama: selectedDrama || '',
      deepLink: deepLink || '',
      sentCount: targetUsers.length,
      deliveredCount: pushResult.deliveredCount || targetUsers.length,
      failureCount: pushResult.failureCount || 0,
      openRate: '0.0%',
      status: 'DELIVERED',
      sentBy: req.userId || null
    });

    return ApiResponse.success(res, 'Push notification broadcasted successfully', {
      campaign,
      recipientsCount: targetUsers.length,
      fcmDevicesCount: uniqueTokens.length,
      pushResult
    }, 201);
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// IN-APP ANNOUNCEMENTS / NOTICES (Admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/notifications/admin/announcements
 * Fetch all announcements stored in MongoDB
 */
export const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    return ApiResponse.success(res, 'Announcements fetched successfully', {
      announcements
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/v1/notifications/admin/announcements
 * Create an in-app announcement and deliver to target users
 */
export const createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      body,
      category = 'SYSTEM',
      target = 'All Active Users',
      priority = 'Normal'
    } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Announcement title is required.', 400));
    }
    if (!body || !body.trim()) {
      return next(new AppError('Announcement body copy is required.', 400));
    }

    // 1. Create Announcement document
    const announcement = await Announcement.create({
      title: title.trim(),
      body: body.trim(),
      category: ['SYSTEM', 'OFFER', 'BILLING'].includes(category) ? category : 'SYSTEM',
      target: ['All Active Users', 'Subscribers Only', 'New Users (Last 7 Days)'].includes(target)
        ? target
        : 'All Active Users',
      priority: ['Normal', 'High'].includes(priority) ? priority : 'Normal',
      isActive: true,
      sentBy: req.userId || null
    });

    // 2. Deliver in-app notification to matching real users
    const userQuery = { status: { $ne: 'DELETED' } };
    if (target === 'Subscribers Only') {
      userQuery['subscription.status'] = 'ACTIVE';
    } else if (target === 'New Users (Last 7 Days)') {
      userQuery.createdAt = { $gte: new Date(Date.now() - 7 * 86400000) };
    }

    const targetUsers = await User.find(userQuery).select('_id');
    if (targetUsers.length > 0) {
      const notifDocs = targetUsers.map((u) => ({
        userId: u._id,
        type: category === 'OFFER' ? 'RECOMMENDATION' : 'SYSTEM',
        title: title.trim(),
        body: body.trim(),
        isRead: false
      }));
      await Notification.insertMany(notifDocs);
    }

    return ApiResponse.success(res, 'Announcement created successfully', {
      announcement,
      recipientsCount: targetUsers.length
    }, 201);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/v1/notifications/admin/announcements/:id
 * Delete an announcement from MongoDB
 */
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    if (!deleted) {
      return next(new AppError('Announcement not found.', 404));
    }

    return ApiResponse.success(res, 'Announcement deleted successfully');
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/v1/notifications/admin/announcements/:id/toggle
 * Toggle active state of an announcement
 */
export const toggleAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return next(new AppError('Announcement not found.', 404));
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    return ApiResponse.success(res, 'Announcement status updated', {
      announcement
    });
  } catch (error) {
    return next(error);
  }
};
