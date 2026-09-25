import { SubscriptionPlan, seedDefaultSubscriptionPlans } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionTransaction } from '../models/SubscriptionTransaction.js';
import { SubscriptionSetting, getOrCreateSubscriptionSettings } from '../models/SubscriptionSetting.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { syncAndCleanSubscriptionData } from '../utils/syncSubscriptionData.js';

export class SubscriptionAdminController {
  /**
   * GET /api/v1/subscriptions/admin/overview
   * Dashboard monetization KPIs & subscriber metrics
   */
  static async getOverview(req, res, next) {
    try {
      await seedDefaultSubscriptionPlans();
      await syncAndCleanSubscriptionData();
      const settings = await getOrCreateSubscriptionSettings();

      const [
        totalActiveSubs,
        totalTrialSubs,
        totalCancelledSubs,
        totalExpiredSubs,
        plans,
        totalRevenueAgg
      ] = await Promise.all([
        Subscription.countDocuments({ status: 'ACTIVE' }),
        Subscription.countDocuments({ status: 'TRIAL' }),
        Subscription.countDocuments({ status: 'CANCELLED' }),
        Subscription.countDocuments({ status: 'EXPIRED' }),
        SubscriptionPlan.find({ status: 'ACTIVE' }),
        SubscriptionTransaction.aggregate([
          { $match: { status: 'SUCCESS' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const activeSubscribersCount = totalActiveSubs + totalTrialSubs;

      // Calculate MRR from real active subscriptions in MongoDB
      let liveMrr = 0;
      const activeSubscriptions = await Subscription.find({
        status: { $in: ['ACTIVE', 'TRIAL'] }
      }).populate('planId');

      activeSubscriptions.forEach((sub) => {
        if (sub.planId && sub.planId.price) {
          const months = sub.planId.durationMonths || Math.max(1, Math.round(sub.planId.durationDays / 30));
          liveMrr += sub.planId.price / months;
        }
      });

      // 100% Real Live Metrics from DB
      const realMrrDisplay = liveMrr >= 100000 ? `${(liveMrr / 100000).toFixed(2)} Lakh` : `${Math.round(liveMrr)}`;
      const totalAccounts = activeSubscribersCount + totalExpiredSubs;
      const realChurnRate = totalAccounts > 0 ? ((totalExpiredSubs / totalAccounts) * 100).toFixed(1) + '%' : '0.0%';
      const totalRevenueCollected = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

      return ApiResponse.success(res, 'Monetization overview retrieved.', {
        kpis: {
          totalMrr: realMrrDisplay,
          activeSubscribers: activeSubscribersCount,
          activeTrialUsers: totalTrialSubs,
          churnRate: realChurnRate,
          totalRevenueCollected
        },
        trialConfig: {
          enabled: settings.trialEnabled,
          trialFee: settings.trialFee,
          trialDurationDays: settings.trialDurationDays,
          termsText: settings.termsText,
          conversionRate: settings.conversionRate,
          gateway: settings.gateway
        }
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/subscriptions/admin/plans
   * List all plans with live active subscriber counts and status directly from DB
   */
  static async getPlans(req, res, next) {
    try {
      await seedDefaultSubscriptionPlans();
      await syncAndCleanSubscriptionData();
      const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, price: 1 });

      // Attach 100% dynamic live subscriber counts from Subscription collection
      const populatedPlans = await Promise.all(
        plans.map(async (p) => {
          const doc = p.toJSON();
          const activeCount = await Subscription.countDocuments({
            planId: p._id,
            status: { $in: ['ACTIVE', 'TRIAL'] }
          });

          doc.activeSubscribers = activeCount;
          const months = doc.durationMonths || Math.max(1, Math.round(doc.durationDays / 30));
          const monthlyEst = activeCount * (doc.price / months);
          doc.mrrContribution = monthlyEst >= 100000 ? `Rs. ${(monthlyEst / 100000).toFixed(2)} Lakh` : `Rs. ${Math.round(monthlyEst)}`;
          return doc;
        })
      );

      return ApiResponse.success(res, 'Subscription plans retrieved.', {
        plans: populatedPlans
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/subscriptions/admin/plans
   * Create a new subscription plan
   */
  static async createPlan(req, res, next) {
    try {
      const {
        name,
        code,
        price,
        originalPrice,
        durationDays,
        durationMonths,
        badge,
        savingsText,
        trialEligible,
        trialFee,
        trialDays,
        features,
        status
      } = req.body;

      if (!name || !price || !durationDays) {
        return next(new AppError('Plan name, price, and durationDays are required.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const planCode = (code || `PLAN_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`).toUpperCase();

      const existing = await SubscriptionPlan.findOne({ code: planCode });
      if (existing) {
        return next(new AppError(`Plan with code "${planCode}" already exists.`, 409, ERROR_CODES.VALIDATION_ERROR));
      }

      const plan = await SubscriptionPlan.create({
        name: name.trim(),
        code: planCode,
        price: Number(price),
        originalPrice: Number(originalPrice) || Number(price),
        durationDays: Number(durationDays),
        durationMonths: Number(durationMonths) || Math.max(1, Math.round(Number(durationDays) / 30)),
        badge: badge ? badge.trim() : null,
        savingsText: savingsText ? savingsText.trim() : null,
        trialEligible: trialEligible !== undefined ? Boolean(trialEligible) : true,
        trialFee: trialFee !== undefined ? Number(trialFee) : 2,
        trialDays: trialDays !== undefined ? Number(trialDays) : 7,
        features: Array.isArray(features) ? features : [],
        status: status || 'ACTIVE'
      });

      return ApiResponse.created(res, 'Subscription plan created successfully.', { plan });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/v1/subscriptions/admin/plans/:id
   * Update an existing subscription plan
   */
  static async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.price) updateData.price = Number(updateData.price);
      if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);
      if (updateData.durationDays) {
        updateData.durationDays = Number(updateData.durationDays);
        if (!updateData.durationMonths) {
          updateData.durationMonths = Math.max(1, Math.round(updateData.durationDays / 30));
        }
      }

      const plan = await SubscriptionPlan.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (!plan) {
        return next(new AppError('Subscription plan not found.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      return ApiResponse.success(res, 'Subscription plan updated successfully.', { plan });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * DELETE /api/v1/subscriptions/admin/plans/:id
   * Archive or delete a plan
   */
  static async deletePlan(req, res, next) {
    try {
      const { id } = req.params;

      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return next(new AppError('Subscription plan not found.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      const activeSubCount = await Subscription.countDocuments({
        planId: plan._id,
        status: { $in: ['ACTIVE', 'TRIAL'] }
      });

      if (activeSubCount > 0) {
        // If subscribers are actively linked, archive rather than hard delete
        plan.status = 'ARCHIVED';
        await plan.save();
        return ApiResponse.success(res, 'Plan has active subscribers and was marked as ARCHIVED.', { plan });
      }

      await SubscriptionPlan.findByIdAndDelete(id);
      return ApiResponse.success(res, 'Subscription plan deleted successfully.');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/subscriptions/admin/trial-settings
   * Fetch 7-Day trial settings
   */
  static async getTrialSettings(req, res, next) {
    try {
      const settings = await getOrCreateSubscriptionSettings();
      return ApiResponse.success(res, 'Trial settings retrieved.', { settings });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /api/v1/subscriptions/admin/trial-settings
   * Update 7-Day trial settings
   */
  static async updateTrialSettings(req, res, next) {
    try {
      const { trialEnabled, enabled, trialFee, trialDurationDays, termsText } = req.body;
      const settings = await getOrCreateSubscriptionSettings();

      if (trialEnabled !== undefined) settings.trialEnabled = Boolean(trialEnabled);
      if (enabled !== undefined) settings.trialEnabled = Boolean(enabled);
      if (trialFee !== undefined) settings.trialFee = Number(trialFee);
      if (trialDurationDays !== undefined) settings.trialDurationDays = Number(trialDurationDays);
      if (termsText !== undefined) settings.termsText = termsText.trim();

      await settings.save();

      // Synchronize trial parameters across all trial-eligible plans in DB
      await SubscriptionPlan.updateMany(
        { trialEligible: true },
        {
          $set: {
            trialFee: settings.trialFee,
            trialDays: settings.trialDurationDays
          }
        }
      );

      return ApiResponse.success(res, 'Trial settings updated successfully.', { settings });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/subscriptions/admin/transactions
   * Transaction history with filters, search, and pagination
   */
  static async getTransactions(req, res, next) {
    try {
      const { search = '', status = 'ALL', page = 1, limit = 20 } = req.query;

      const query = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

      const [transactions, total] = await Promise.all([
        SubscriptionTransaction.find(query)
          .populate('userId', 'firstName lastName name phone email')
          .populate('planId', 'name code price period')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        SubscriptionTransaction.countDocuments(query)
      ]);

      const formatted = transactions.map((t) => ({
        id: t.gatewayPaymentId || t._id.toString(),
        orderId: t.gatewayOrderId || 'N/A',
        user: t.userId ? (t.userId.name || `${t.userId.firstName || ''} ${t.userId.lastName || ''}`.trim() || 'Viewer') : 'Unknown User',
        phone: t.userId ? (t.userId.phone || 'N/A') : 'N/A',
        plan: t.planId ? t.planId.name : (t.type === 'TRIAL_TOKEN' ? '7-Day Free Trial' : '1 Month Pass'),
        amount: `Rs. ${t.amount}`,
        method: t.type === 'TRIAL_TOKEN' ? 'UPI AutoPay (Token)' : 'Razorpay UPI / Netbanking',
        status: t.status,
        date: new Date(t.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        createdAt: t.createdAt
      }));

      return ApiResponse.success(res, 'Subscription transactions retrieved.', {
        transactions: formatted,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/subscriptions/admin/subscribers
   * List active & trial subscribers with current period status and days remaining
   */
  static async getSubscribers(req, res, next) {
    try {
      await syncAndCleanSubscriptionData();
      const { search = '', status = 'ALL', page = 1, limit = 20 } = req.query;

      const query = {};
      if (status && status !== 'ALL') {
        query.status = status;
      }

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

      const [subscriptions, total] = await Promise.all([
        Subscription.find(query)
          .populate('userId', 'firstName lastName name phone email isVip avatarUrl')
          .populate('planId', 'name code price durationDays')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        Subscription.countDocuments(query)
      ]);

      const now = new Date();

      const formatted = subscriptions.map((s) => {
        const diffMs = new Date(s.currentPeriodEnd).getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        return {
          id: s._id.toString(),
          userId: s.userId ? s.userId._id.toString() : null,
          user: s.userId ? (s.userId.name || `${s.userId.firstName || ''} ${s.userId.lastName || ''}`.trim() || 'Viewer') : 'Unknown User',
          phone: s.userId ? (s.userId.phone || 'N/A') : 'N/A',
          email: s.userId ? (s.userId.email || 'N/A') : 'N/A',
          planName: s.planId ? s.planId.name : (s.isTrial ? '7-Day Free Trial' : '1 Month Pass'),
          status: s.status,
          isTrial: s.isTrial,
          daysRemaining: daysLeft,
          currentPeriodEnd: s.currentPeriodEnd,
          autoRenew: s.autoRenew,
          startDate: s.startDate
        };
      });

      return ApiResponse.success(res, 'Subscribers list retrieved.', {
        subscribers: formatted,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /api/v1/subscriptions/admin/subscribers/:id/override
   * Manual admin action: Extend subscription days or revoke access
   */
  static async overrideSubscriberVip(req, res, next) {
    try {
      const { id } = req.params;
      const { action, days = 30 } = req.body; // 'EXTEND' | 'REVOKE'

      const sub = await Subscription.findById(id);
      if (!sub) {
        return next(new AppError('Subscription record not found.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      const now = new Date();

      if (action === 'EXTEND') {
        const baseDate = sub.currentPeriodEnd > now ? new Date(sub.currentPeriodEnd) : now;
        baseDate.setDate(baseDate.getDate() + Number(days));
        sub.currentPeriodEnd = baseDate;
        sub.status = 'ACTIVE';
        await sub.save();

        if (sub.userId) {
          await User.findByIdAndUpdate(sub.userId, {
            isVip: true,
            vipExpiresAt: baseDate
          });
        }

        return ApiResponse.success(res, `Subscription access extended by ${days} days.`, { subscription: sub });
      } else if (action === 'REVOKE') {
        sub.status = 'EXPIRED';
        sub.autoRenew = false;
        sub.currentPeriodEnd = now;
        await sub.save();

        if (sub.userId) {
          await User.findByIdAndUpdate(sub.userId, {
            isVip: false,
            vipExpiresAt: null,
            plan: 'Free Tier'
          });
        }

        return ApiResponse.success(res, 'Subscription access revoked immediately.', { subscription: sub });
      } else {
        return next(new AppError('Invalid action. Use EXTEND or REVOKE.', 400, ERROR_CODES.VALIDATION_ERROR));
      }
    } catch (err) {
      return next(err);
    }
  }
}
