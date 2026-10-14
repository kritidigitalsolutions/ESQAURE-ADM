import { SubscriptionPlan, seedDefaultSubscriptionPlans } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionTransaction } from '../models/SubscriptionTransaction.js';
import { SubscriptionSetting, getOrCreateSubscriptionSettings } from '../models/SubscriptionSetting.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { syncAndCleanSubscriptionData } from '../utils/syncSubscriptionData.js';

// In-memory caching for ultra-fast telemetry responses
let overviewCache = { data: null, expiresAt: 0 };
let revenueCache = { data: null, expiresAt: 0 };

export const invalidateSubscriptionAdminCache = () => {
  overviewCache = { data: null, expiresAt: 0 };
  revenueCache = { data: null, expiresAt: 0 };
};

export class SubscriptionAdminController {
  /**
   * GET /api/v1/subscriptions/admin/overview
   * Dashboard monetization KPIs & subscriber metrics
   */
  static async getOverview(req, res, next) {
    try {
      const nowMs = Date.now();
      if (overviewCache.data && nowMs < overviewCache.expiresAt) {
        return ApiResponse.success(res, 'Monetization overview retrieved.', overviewCache.data);
      }

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
        SubscriptionPlan.find({ status: 'ACTIVE' }).lean(),
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
      }).populate('planId').lean();

      activeSubscriptions.forEach((sub) => {
        if (sub.planId && sub.planId.price) {
          const months = sub.planId.durationMonths || Math.max(1, Math.round((sub.planId.durationDays || 30) / 30));
          liveMrr += sub.planId.price / months;
        }
      });

      // 100% Real Live Metrics from DB
      const realMrrDisplay = liveMrr >= 100000 ? `${(liveMrr / 100000).toFixed(2)} Lakh` : `${Math.round(liveMrr)}`;
      const totalAccounts = activeSubscribersCount + totalExpiredSubs;
      const realChurnRate = totalAccounts > 0 ? ((totalExpiredSubs / totalAccounts) * 100).toFixed(1) + '%' : '0.0%';
      const totalRevenueCollected = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

      const payload = {
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
      };

      overviewCache = { data: payload, expiresAt: nowMs + 20 * 1000 }; // 20s TTL
      return ApiResponse.success(res, 'Monetization overview retrieved.', payload);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/subscriptions/admin/revenue-analytics
   * Real database transaction revenue aggregation for IncomeChart (today, monthly, yearly)
   */
  static async getRevenueAnalytics(req, res, next) {
    try {
      const now = new Date();
      const nowMs = now.getTime();
      if (revenueCache.data && nowMs < revenueCache.expiresAt) {
        return ApiResponse.success(res, 'Revenue analytics retrieved successfully.', revenueCache.data);
      }

      // --- 1. Compute time boundaries ---
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const startOfTodayMs = startOfToday.getTime();
      const startOfYesterdayMs = startOfTodayMs - 24 * 60 * 60 * 1000;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const startOfMonthMs = startOfMonth.getTime();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const startOfPrevMonthMs = startOfPrevMonth.getTime();

      const yearlyBuckets = [];
      for (let k = 5; k >= 0; k--) {
        const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
        const mName = d.toLocaleString('en-US', { month: 'short' });
        const yShort = String(d.getFullYear()).slice(-2);
        const yFull = d.getFullYear();
        const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        yearlyBuckets.push({
          label: `${mName} '${yShort}`,
          time: `${mName} ${yFull}`,
          startDateMs: start.getTime(),
          endDateMs: end.getTime(),
          value: 0
        });
      }

      const sixMonthsAgo = new Date(yearlyBuckets[0].startDateMs);

      // Single lean query for all transactions within past 6 months
      const sixMonthTxns = await SubscriptionTransaction.find({
        status: 'SUCCESS',
        createdAt: { $gte: sixMonthsAgo, $lte: now }
      }).select('amount createdAt').lean();

      // Hourly buckets for Today
      const hourlyBuckets = [
        { label: '00:00', time: '12:00 AM', hourStart: 0, hourEnd: 4, value: 0 },
        { label: '04:00', time: '04:00 AM', hourStart: 4, hourEnd: 8, value: 0 },
        { label: '08:00', time: '08:00 AM', hourStart: 8, hourEnd: 12, value: 0 },
        { label: '12:00', time: '12:00 PM', hourStart: 12, hourEnd: 16, value: 0 },
        { label: '16:00', time: '04:00 PM', hourStart: 16, hourEnd: 20, value: 0 },
        { label: '20:00', time: '08:00 PM', hourStart: 20, hourEnd: 23, value: 0 },
        { label: '23:00', time: '11:00 PM', hourStart: 23, hourEnd: 24, value: 0 },
      ];

      // Month interval buckets
      const monthName = now.toLocaleString('en-US', { month: 'short' });
      const prevMonthName = startOfPrevMonth.toLocaleString('en-US', { month: 'short' });

      const monthBuckets = [
        { label: `1-5 ${monthName}`, time: `1-5 ${monthName}`, startDay: 1, endDay: 5, value: 0 },
        { label: `6-10 ${monthName}`, time: `6-10 ${monthName}`, startDay: 6, endDay: 10, value: 0 },
        { label: `11-15 ${monthName}`, time: `11-15 ${monthName}`, startDay: 11, endDay: 15, value: 0 },
        { label: `16-20 ${monthName}`, time: `16-20 ${monthName}`, startDay: 16, endDay: 20, value: 0 },
        { label: `21-25 ${monthName}`, time: `21-25 ${monthName}`, startDay: 21, endDay: 25, value: 0 },
        { label: `26-31 ${monthName}`, time: `26-31 ${monthName}`, startDay: 26, endDay: 31, value: 0 },
      ];

      let todayTotal = 0;
      let yesterdayTotal = 0;
      let monthTotal = 0;
      let prevMonthTotal = 0;
      let sixMonthTotal = 0;

      // Ultra-fast single-pass processing
      for (let i = 0; i < sixMonthTxns.length; i++) {
        const t = sixMonthTxns[i];
        const amt = t.amount || 0;
        const dt = new Date(t.createdAt);
        const tMs = dt.getTime();

        sixMonthTotal += amt;

        // Yearly bucket matching
        const yb = yearlyBuckets.find((b) => tMs >= b.startDateMs && tMs <= b.endDateMs);
        if (yb) yb.value += amt;

        // Today & Yesterday
        if (tMs >= startOfTodayMs && tMs <= nowMs) {
          todayTotal += amt;
          const h = dt.getHours();
          const hb = hourlyBuckets.find((b) => h >= b.hourStart && h < b.hourEnd) || hourlyBuckets[hourlyBuckets.length - 1];
          if (hb) hb.value += amt;
        } else if (tMs >= startOfYesterdayMs && tMs < startOfTodayMs) {
          yesterdayTotal += amt;
        }

        // Current Month vs Previous Month
        if (tMs >= startOfMonthMs && tMs <= nowMs) {
          monthTotal += amt;
          const day = dt.getDate();
          const mb = monthBuckets.find((b) => day >= b.startDay && day <= b.endDay) || monthBuckets[monthBuckets.length - 1];
          if (mb) mb.value += amt;
        } else if (tMs >= startOfPrevMonthMs && tMs < startOfMonthMs) {
          prevMonthTotal += amt;
        }
      }

      const todayTrendPct = yesterdayTotal > 0
        ? `${(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1)}%`
        : '+0.0%';
      const todayTrendSign = (todayTotal > yesterdayTotal && !todayTrendPct.startsWith('+')) ? '+' : '';

      const monthTrendPct = prevMonthTotal > 0
        ? `${(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1)}%`
        : '+0.0%';

      const payload = {
        today: {
          label: "TODAY'S REVENUE",
          total: `₹${todayTotal.toLocaleString('en-IN')}`,
          totalNum: todayTotal,
          trend: `${todayTrendSign}${todayTrendPct}`,
          subtext: `vs yesterday (₹${yesterdayTotal.toLocaleString('en-IN')})`,
          points: hourlyBuckets.map((b) => ({ label: b.label, value: b.value, time: b.time }))
        },
        monthly: {
          label: `${monthName.toUpperCase()} ${now.getFullYear()} REVENUE`,
          total: `₹${monthTotal.toLocaleString('en-IN')}`,
          totalNum: monthTotal,
          trend: `${monthTotal >= prevMonthTotal ? '+' : ''}${monthTrendPct}`,
          subtext: `vs ${prevMonthName} ${startOfPrevMonth.getFullYear()} (₹${prevMonthTotal.toLocaleString('en-IN')})`,
          points: monthBuckets.map((b) => ({ label: b.label, value: b.value, time: b.time }))
        },
        yearly: {
          label: 'PAST 6 MONTHS REVENUE',
          total: sixMonthTotal >= 100000 ? `₹${(sixMonthTotal / 100000).toFixed(2)} Lakh` : `₹${sixMonthTotal.toLocaleString('en-IN')}`,
          totalNum: sixMonthTotal,
          trend: '+0.0%',
          subtext: 'vs previous 6 mo',
          points: yearlyBuckets.map((b) => ({ label: b.label, value: b.value, time: b.time }))
        }
      };

      revenueCache = { data: payload, expiresAt: nowMs + 30 * 1000 }; // 30s TTL
      return ApiResponse.success(res, 'Revenue analytics retrieved successfully.', payload);
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

      if (search && search.trim()) {
        const sRegex = new RegExp(search.trim(), 'i');
        const matchingUsers = await User.find({
          $or: [
            { firstName: sRegex },
            { lastName: sRegex },
            { email: sRegex },
            { phoneNumber: sRegex }
          ]
        }).select('_id');
        const userIds = matchingUsers.map((u) => u._id);

        query.$or = [
          { gatewayPaymentId: sRegex },
          { gatewayOrderId: sRegex },
          ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : [])
        ];
      }

      const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

      const [transactions, total] = await Promise.all([
        SubscriptionTransaction.find(query)
          .populate('userId', 'firstName lastName name phoneNumber countryCode phone email avatarUrl')
          .populate('planId', 'name code price period')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        SubscriptionTransaction.countDocuments(query)
      ]);

      const formatted = transactions.map((t) => ({
        id: t.gatewayPaymentId || t._id.toString(),
        orderId: t.gatewayOrderId || 'N/A',
        user: t.userId ? (t.userId.name || `${t.userId.firstName || ''} ${t.userId.lastName || ''}`.trim() || `User #${(t.userId.phoneNumber ? String(t.userId.phoneNumber).slice(-4) : '1001')}`) : 'Unknown User',
        phone: t.userId ? (t.userId.phoneNumber ? `${t.userId.countryCode || '+91'} ${t.userId.phoneNumber}`.trim() : (t.userId.phone || 'N/A')) : 'N/A',
        email: t.userId ? (t.userId.email || '') : '',
        avatarUrl: t.userId?.avatarUrl || '',
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
          .populate('userId', 'firstName lastName name phoneNumber countryCode phone email isVip avatarUrl')
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
        const u = s.userId;

        let formattedPhone = '—';
        if (u) {
          if (u.phone) {
            formattedPhone = u.phone;
          } else if (u.phoneNumber) {
            formattedPhone = `${u.countryCode || '+91'} ${u.phoneNumber}`.trim();
          }
        }

        let formattedEmail = '—';
        if (u && u.email && u.email !== 'N/A' && u.email !== '—') {
          formattedEmail = u.email;
        }

        let userName = 'Viewer';
        if (u) {
          const rawName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
          if (rawName && rawName !== u.phoneNumber) {
            userName = rawName;
          } else if (u.phoneNumber) {
            userName = `User #${String(u.phoneNumber).slice(-4)}`;
          }
        }

        return {
          id: s._id.toString(),
          userId: u ? u._id.toString() : null,
          user: userName,
          name: userName,
          phone: formattedPhone,
          email: formattedEmail,
          avatarUrl: u ? u.avatarUrl : '',
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
