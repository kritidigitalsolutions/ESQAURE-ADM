import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Genre } from '../models/Genre.js';
import { removeDummyUsers } from '../config/seedUsers.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class UserController {
  /**
   * GET /api/v1/users
   * List users with optional search, filter, and KPI stats
   */
  static async getUsers(req, res, next) {
    try {
      // Permanently purge any dummy or mock users so only 100% genuine users are returned
      await removeDummyUsers();

      const { search = '', filter = 'ALL', limit = 100, page = 1 } = req.query;

      const query = { status: { $ne: 'DELETED' } };

      // Apply filter type
      if (filter === 'VIP') {
        query.isVip = true;
      } else if (filter === 'FREE') {
        query.isVip = { $ne: true };
        query.status = { $ne: 'SUSPENDED' };
      } else if (filter === 'SUSPENDED') {
        query.status = 'SUSPENDED';
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

        query.$and = [{ $or: orClauses }];
      }

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      // Calculate global counts and real analytics for KPIs
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const [totalUsers, vipUsers, freeUsers, suspendedUsers, activeTodayUsers, allUsers] = await Promise.all([
        User.countDocuments({ status: { $ne: 'DELETED' } }),
        User.countDocuments({ isVip: true, status: { $ne: 'DELETED' } }),
        User.countDocuments({ isVip: { $ne: true }, status: { $ne: 'SUSPENDED', $ne: 'DELETED' } }),
        User.countDocuments({ status: 'SUSPENDED' }),
        User.countDocuments({ status: { $ne: 'DELETED' }, lastLoginAt: { $gte: oneDayAgo } }),
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
            plan: u.plan || (u.isVip ? 'Monthly Pass' : 'Free Tier'),
            isVip: Boolean(u.isVip),
            vipExpiresAt: u.vipExpiresAt ? new Date(u.vipExpiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            status: u.status || 'ACTIVE',
            totalWatchTime: u.totalWatchTime || '0.0 hrs',
            promoCode: u.promoCode || u.voucherCode || null,
            avatarUrl: u.avatarUrl || '',
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
   * Grant or revoke VIP tier
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
        user.plan = planName || (days >= 365 ? 'Annual Pass' : 'Monthly Pass');
      } else {
        user.isVip = false;
        user.vipExpiresAt = null;
        user.plan = 'Free Tier';
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
}
