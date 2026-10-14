import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Genre } from '../models/Genre.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { AccountDeletionRequest } from '../models/AccountDeletionRequest.js';
import { removeDummyUsers } from '../config/seedUsers.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { syncAndCleanSubscriptionData } from '../utils/syncSubscriptionData.js';
import { resolveMediaUrl } from '../utils/formatters.js';

// In-memory cache for user activity telemetry
let activityAnalyticsCache = { data: null, expiresAt: 0 };

export const invalidateUserActivityCache = () => {
  activityAnalyticsCache = { data: null, expiresAt: 0 };
};

export class UserController {
  /**
   * GET /api/v1/users
   * List users with optional search, filter, and KPI stats
   */
  static async getUsers(req, res, next) {
    try {
      // Permanently purge any dummy or mock users so only 100% genuine users are returned
      await removeDummyUsers();
      await syncAndCleanSubscriptionData();

      const { search = '', filter = 'ALL', limit = 100, page = 1 } = req.query;

      const query = { status: { $ne: 'DELETED' } };

      // Apply filter type
      if (filter === 'VIP' || filter === 'SUBSCRIBED') {
        query.isVip = true;
        query.status = { $ne: 'SUSPENDED' };
      } else if (filter === 'FREE') {
        query.isVip = { $ne: true };
        query.status = { $nin: ['SUSPENDED', 'PENDING_DELETION'] };
      } else if (filter === 'SUSPENDED') {
        query.status = 'SUSPENDED';
      } else if (filter === 'DELETION_REQUESTS' || filter === 'PENDING_DELETION') {
        query.$or = [
          { status: 'PENDING_DELETION' },
          { 'deletionRequest.isRequested': true }
        ];
      }

      // Apply search term
      if (search && search.trim()) {
        const term = search.trim();
        const searchRegex = new RegExp(term, 'i');
        const digitsOnly = term.replace(/\D/g, '');

        const orClauses = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phoneNumber: searchRegex }
        ];

        if (digitsOnly) {
          orClauses.push({ phoneNumber: new RegExp(digitsOnly, 'i') });
        }

        if (query.$and) {
          query.$and.push({ $or: orClauses });
        } else {
          query.$and = [{ $or: orClauses }];
        }
      }

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      // Calculate global counts and real analytics for KPIs
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [totalUsers, vipUsers, freeUsers, suspendedUsers, activeTodayUsers, deletionRequestsCount, allUsers] = await Promise.all([
        User.countDocuments({ status: { $ne: 'DELETED' } }),
        User.countDocuments({ isVip: true, status: { $ne: 'DELETED' } }),
        User.countDocuments({ isVip: { $ne: true }, status: { $nin: ['SUSPENDED', 'DELETED', 'PENDING_DELETION'] } }),
        User.countDocuments({ status: 'SUSPENDED' }),
        User.countDocuments({ status: { $ne: 'DELETED' }, lastLoginAt: { $gte: oneDayAgo } }),
        User.countDocuments({
          $or: [
            { status: 'PENDING_DELETION' },
            { 'deletionRequest.isRequested': true }
          ],
          status: { $ne: 'DELETED' }
        }),
        User.find({ status: { $ne: 'DELETED' } }).select('totalWatchTime lastLoginAt name isVip firstName lastName phoneNumber countryCode')
      ]);

      // Calculate real average watch time across all users in database
      let totalHours = 0;
      let maxHours = 0;
      allUsers.forEach((u) => {
        const hours = parseFloat(u.totalWatchTime) || 0;
        totalHours += hours;
        if (hours > maxHours) {
          maxHours = hours;
        }
      });
      const avgWatchHours = allUsers.length > 0 ? (totalHours / allUsers.length).toFixed(1) : '0.0';

      const userList = users.map((u) => {
        try {
          return u.toJSON();
        } catch {
          const fn = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return {
            id: u._id.toString(),
            name: fn || `${u.countryCode || '+91'} ${u.phoneNumber}`,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: `${u.countryCode || '+91'} ${u.phoneNumber}`.trim(),
            email: u.email || '—',
            plan: u.plan || (u.isVip ? '1 Month Pass' : 'Free Tier'),
            isVip: Boolean(u.isVip),
            vipExpiresAt: u.vipExpiresAt ? new Date(u.vipExpiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            status: u.status || 'ACTIVE',
            isDeletionRequested: Boolean(u.deletionRequest?.isRequested || u.status === 'PENDING_DELETION'),
            deletionRequest: u.deletionRequest || {
              isRequested: false,
              status: 'NONE',
              requestedAt: null,
              scheduledDeletionAt: null,
              reason: ''
            },
            deletionRequestedAt: u.deletionRequest?.requestedAt || null,
            scheduledDeletionAt: u.deletionRequest?.scheduledDeletionAt || null,
            totalWatchTime: u.totalWatchTime || '0.0 hrs',
            promoCode: u.promoCode || u.voucherCode || null,
            avatarUrl: resolveMediaUrl(u.avatarUrl || '', req),
            joinedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '2026',
            lastActive: 'Recently'
          };
        }
      });

      return ApiResponse.success(res, 'Users fetched successfully', {
        users: userList,
        counts: {
          all: totalUsers,
          vip: vipUsers,
          free: freeUsers,
          suspended: suspendedUsers,
          activeToday: activeTodayUsers,
          deletionRequests: deletionRequestsCount,
          avgWatchTime: avgWatchHours,
          peakWatchTime: maxHours > 0 ? maxHours.toFixed(1) : '0.0'
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get single user details
   */
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const user = await User.findById(id).populate('interests', 'name slug');
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      return ApiResponse.success(res, 'User retrieved successfully', {
        user: user.toJSON()
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id
   * Update user details (firstName, lastName, email, phone, promoCode, avatarUrl)
   */
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const { firstName, lastName, email, phone, phoneNumber, promoCode, voucherCode, avatarUrl } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      if (firstName !== undefined) user.firstName = firstName.trim();
      if (lastName !== undefined) user.lastName = lastName.trim();
      if (email !== undefined) user.email = email.trim().toLowerCase();
      if (promoCode !== undefined) user.promoCode = promoCode ? promoCode.trim().toUpperCase() : null;
      if (voucherCode !== undefined) user.voucherCode = voucherCode ? voucherCode.trim().toUpperCase() : null;
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl.trim();

      const rawPhone = phone || phoneNumber;
      if (rawPhone !== undefined) {
        const cleaned = rawPhone.replace(/\D/g, '');
        if (cleaned) {
          user.phoneNumber = cleaned.slice(-10);
        }
      }

      await user.save();

      return ApiResponse.success(res, 'User updated successfully', {
        user: user.toJSON()
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/status
   * Toggle or set status (ACTIVE or SUSPENDED)
   */
  static async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const { status } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      const newStatus = status ? status.toUpperCase() : user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      if (!['ACTIVE', 'SUSPENDED'].includes(newStatus)) {
        return next(new AppError('Invalid status value. Must be ACTIVE or SUSPENDED.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      user.status = newStatus;
      await user.save();

      return ApiResponse.success(res, `User status updated to ${newStatus}`, {
        user: user.toJSON()
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/vip
   * Grant or revoke subscription tier
   */
  static async updateUserVip(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const { isVip, days = 30, planName } = req.body;
      const user = await User.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      if (isVip) {
        user.isVip = true;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + Number(days || 30));
        user.vipExpiresAt = expiry;
        const resolvedPlanName = planName || (Number(days) >= 365 ? '12 Months Pass' : '1 Month Pass');
        user.plan = resolvedPlanName;

        // Find or associate matching SubscriptionPlan
        const planDoc = await SubscriptionPlan.findOne({
          $or: [{ name: new RegExp(resolvedPlanName, 'i') }, { durationDays: Number(days) }]
        });

        // Expire older active subscriptions for this user
        await Subscription.updateMany(
          { userId: user._id, status: { $in: ['ACTIVE', 'TRIAL'] } },
          { $set: { status: 'EXPIRED' } }
        );

        // Create new active Subscription document
        const newSub = await Subscription.create({
          userId: user._id,
          planId: planDoc?._id || null,
          planCode: planDoc?.code || (Number(days) >= 365 ? 'PLAN_12M' : 'PLAN_1M'),
          status: 'ACTIVE',
          isTrial: false,
          startDate: new Date(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: expiry,
          autoRenew: true,
          paymentGateway: 'MANUAL_ADMIN_OVERRIDE'
        });

        user.currentSubscriptionId = newSub._id;
      } else {
        user.isVip = false;
        user.vipExpiresAt = null;
        user.plan = 'Free Tier';
        user.currentSubscriptionId = null;

        await Subscription.updateMany(
          { userId: user._id, status: { $in: ['ACTIVE', 'TRIAL'] } },
          { $set: { status: 'EXPIRED' } }
        );
      }

      await user.save();

      return ApiResponse.success(
        res,
        isVip ? `Granted ${days} days subscription access` : 'Reverted user to Free Tier',
        { user: user.toJSON() }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Permanently delete user
   */
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      await Subscription.deleteMany({ userId: id });
      await AccountDeletionRequest.updateMany(
        { userId: id, status: 'PENDING' },
        { status: 'APPROVED', reviewedBy: req.admin?.email || 'admin', reviewedAt: new Date(), adminNotes: 'Account removed by admin' }
      );
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      return ApiResponse.success(res, `User "${user.fullName || user.phoneNumber}" has been removed`, {
        id
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/users/admin/deletion-requests
   * List all user account deletion requests submitted to admin with real status & timeline
   */
  static async getDeletionRequests(req, res, next) {
    try {
      const requests = await AccountDeletionRequest.find()
        .sort({ requestedAt: -1 })
        .populate('userId', 'firstName lastName phoneNumber countryCode email plan isVip totalWatchTime avatarUrl status');

      const pendingCount = await AccountDeletionRequest.countDocuments({ status: 'PENDING' });

      return ApiResponse.success(res, 'Account deletion requests retrieved successfully', {
        requests,
        pendingCount
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/verify-delete
   * Admin verifies user profile, entitelements, and permanently deletes user account
   */
  static async verifyAndDeleteUser(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const user = await User.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      const userName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.phoneNumber;

      // 1. Terminate and purge subscriptions
      await Subscription.deleteMany({ userId: id });

      // 2. Mark AccountDeletionRequest as APPROVED
      await AccountDeletionRequest.updateMany(
        { userId: id, status: 'PENDING' },
        {
          status: 'APPROVED',
          reviewedBy: req.admin?.email || 'admin',
          reviewedAt: new Date(),
          adminNotes: req.body?.adminNotes || 'Verified and approved for permanent deletion by admin'
        }
      );

      // 3. Permanently remove the user record
      await User.findByIdAndDelete(id);

      return ApiResponse.success(
        res,
        `User "${userName}" has been verified and permanently deleted by administrator.`,
        { id, deleted: true, status: 'PERMANENTLY_DELETED' }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/reject-deletion
   * Admin rejects/cancels the user's account deletion request and restores account to ACTIVE
   */
  static async rejectDeletionRequest(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError('Invalid User ID', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const user = await User.findById(id);
      if (!user) {
        return next(new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      const adminNote = req.body?.adminNote || req.body?.reason || 'Deletion request rejected after admin verification';

      user.status = 'ACTIVE';
      user.deletionRequest = {
        isRequested: false,
        requestedAt: null,
        scheduledDeletionAt: null,
        reason: '',
        status: 'REJECTED',
        adminNote
      };
      await user.save();

      await AccountDeletionRequest.updateMany(
        { userId: id, status: 'PENDING' },
        {
          status: 'REJECTED',
          reviewedBy: req.admin?.email || 'admin',
          reviewedAt: new Date(),
          adminNotes: adminNote
        }
      );

      return ApiResponse.success(
        res,
        `Account deletion request for "${user.fullName || user.phoneNumber}" rejected. User restored to ACTIVE.`,
        { user: user.toJSON() }
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/v1/users/admin/activity-analytics
   * Dynamic activity telemetry derived from real database users and subscriptions
   */
  static async getActivityAnalytics(req, res, next) {
    try {
      const now = new Date();
      const nowMs = now.getTime();

      if (activityAnalyticsCache.data && nowMs < activityAnalyticsCache.expiresAt) {
        return ApiResponse.success(res, 'Activity analytics retrieved successfully.', activityAnalyticsCache.data);
      }

      // 1-Year boundary captures all intervals (1D, 7D, 1M, 1Y)
      const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0);

      // Single parallel lean query pair for the entire year
      const [allYearUsers, allYearSubs] = await Promise.all([
        User.find({
          status: { $ne: 'DELETED' },
          createdAt: { $gte: oneYearAgo, $lte: now }
        }).select('createdAt').lean(),
        Subscription.find({
          createdAt: { $gte: oneYearAgo, $lte: now }
        }).select('createdAt').lean()
      ]);

      const userTimes = allYearUsers.map((u) => new Date(u.createdAt).getTime());
      const subTimes = allYearSubs.map((s) => new Date(s.createdAt).getTime());

      // --- 1. 1D (Today's Bi-Hourly checkpoints from 00:00 to 22:00) ---
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const startOfTodayMs = startOfToday.getTime();
      const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

      const d1Users = hours.map((h, i) => {
        const startH = i * 2;
        const endH = startH + 2;
        let count = 0;
        for (let j = 0; j < userTimes.length; j++) {
          const t = userTimes[j];
          if (t >= startOfTodayMs && t <= nowMs) {
            const uh = new Date(t).getHours();
            if (uh >= startH && uh < endH) count++;
          }
        }
        return {
          time: h,
          date: h,
          raw: count,
          badge: count > 0 ? `+${count}` : '0',
          note: `${h} user signups`
        };
      });

      const d1Subs = hours.map((h, i) => {
        const startH = i * 2;
        const endH = startH + 2;
        let count = 0;
        for (let j = 0; j < subTimes.length; j++) {
          const t = subTimes[j];
          if (t >= startOfTodayMs && t <= nowMs) {
            const sh = new Date(t).getHours();
            if (sh >= startH && sh < endH) count++;
          }
        }
        return {
          time: h,
          date: h,
          raw: count,
          badge: count > 0 ? `+${count}` : '0',
          note: `${h} paid passes`
        };
      });

      // --- 2. 7D (14 Rolling Days) ---
      const d7Users = [];
      const d7Subs = [];

      for (let i = 13; i >= 0; i--) {
        const dayDate = new Date(now);
        dayDate.setDate(now.getDate() - i);
        const dayStartMs = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0).getTime();
        const dayEndMs = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59).getTime();

        const weekday = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = dayDate.getDate();
        const timeLabel = `${weekday} ${dayNum}`;

        let uCount = 0;
        for (let j = 0; j < userTimes.length; j++) {
          const t = userTimes[j];
          if (t >= dayStartMs && t <= dayEndMs) uCount++;
        }

        let sCount = 0;
        for (let j = 0; j < subTimes.length; j++) {
          const t = subTimes[j];
          if (t >= dayStartMs && t <= dayEndMs) sCount++;
        }

        d7Users.push({
          time: timeLabel,
          date: timeLabel,
          raw: uCount,
          badge: uCount > 0 ? `+${uCount}` : '0',
          note: `${weekday} registered users`
        });

        d7Subs.push({
          time: timeLabel,
          date: timeLabel,
          raw: sCount,
          badge: sCount > 0 ? `+${sCount}` : '0',
          note: `${weekday} subscriptions`
        });
      }

      // --- 3. 1M (15 intervals over 30 days) ---
      const d1MUsers = [];
      const d1MSubs = [];
      for (let idx = 14; idx >= 0; idx--) {
        const d = new Date(now);
        d.setDate(now.getDate() - idx * 2);
        const dayStartMs = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 0, 0, 0).getTime();
        const dayEndMs = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();
        const dayNum = d.getDate();
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const timeLabel = `${dayNum} ${monthName}`;

        let uCount = 0;
        for (let j = 0; j < userTimes.length; j++) {
          const t = userTimes[j];
          if (t >= dayStartMs && t <= dayEndMs) uCount++;
        }

        let sCount = 0;
        for (let j = 0; j < subTimes.length; j++) {
          const t = subTimes[j];
          if (t >= dayStartMs && t <= dayEndMs) sCount++;
        }

        d1MUsers.push({
          time: timeLabel,
          date: timeLabel,
          raw: uCount,
          badge: uCount > 0 ? `+${uCount}` : '0',
          note: `${monthName} registrations`
        });

        d1MSubs.push({
          time: timeLabel,
          date: timeLabel,
          raw: sCount,
          badge: sCount > 0 ? `+${sCount}` : '0',
          note: `${monthName} conversions`
        });
      }

      // --- 4. 1Y (12 Monthly Checkpoints) ---
      const d1YUsers = [];
      const d1YSubs = [];

      for (let k = 11; k >= 0; k--) {
        const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
        const monthStartMs = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0).getTime();
        const monthEndMs = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime();
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const yearShort = String(d.getFullYear()).slice(-2);
        const timeLabel = `${monthName} '${yearShort}`;

        let uCount = 0;
        for (let j = 0; j < userTimes.length; j++) {
          const t = userTimes[j];
          if (t >= monthStartMs && t <= monthEndMs) uCount++;
        }

        let sCount = 0;
        for (let j = 0; j < subTimes.length; j++) {
          const t = subTimes[j];
          if (t >= monthStartMs && t <= monthEndMs) sCount++;
        }

        d1YUsers.push({
          time: timeLabel,
          date: timeLabel,
          raw: uCount,
          badge: uCount > 0 ? `+${uCount}` : '0',
          note: `${monthName} total active`
        });

        d1YSubs.push({
          time: timeLabel,
          date: timeLabel,
          raw: sCount,
          badge: sCount > 0 ? `+${sCount}` : '0',
          note: `${monthName} subscribers`
        });
      }

      const payload = {
        users: {
          '1D': d1Users,
          '7D': d7Users,
          '1M': d1MUsers,
          '1Y': d1YUsers,
          'MAX': d1YUsers
        },
        subscribers: {
          '1D': d1Subs,
          '7D': d7Subs,
          '1M': d1MSubs,
          '1Y': d1YSubs,
          'MAX': d1YSubs
        }
      };

      activityAnalyticsCache = { data: payload, expiresAt: nowMs + 30 * 1000 }; // 30s TTL
      return ApiResponse.success(res, 'Activity analytics retrieved successfully.', payload);
    } catch (err) {
      return next(err);
    }
  }
}
