import { SubscriptionPlan, seedDefaultSubscriptionPlans } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionTransaction } from '../models/SubscriptionTransaction.js';
import { SubscriptionSetting, getOrCreateSubscriptionSettings } from '../models/SubscriptionSetting.js';
import { User } from '../models/User.js';
import { RazorpayService } from '../services/razorpay.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class SubscriptionController {
  /**
   * GET /api/subscriptions/plans
   * Public endpoint for mobile app paywall to display pricing tiers & trial info
   */
  static async getPlans(req, res, next) {
    try {
      await seedDefaultSubscriptionPlans();
      const settings = await getOrCreateSubscriptionSettings();

      const plans = await SubscriptionPlan.find({ status: 'ACTIVE' }).sort({ sortOrder: 1, price: 1 });

      const trialPlan = plans.find((p) => p.trialEligible);

      const trialInfo = {
        enabled: Boolean(settings.trialEnabled && trialPlan),
        trialFee: settings.trialFee || (trialPlan ? trialPlan.trialFee : 2),
        trialDurationDays: settings.trialDurationDays || (trialPlan ? trialPlan.trialDays : 7),
        termsText: settings.termsText || `Enjoy a 7-day free trial for just Rs. 2. The Rs. 2 trial payment is non-refundable. After the 7-day trial period ends, your subscription will automatically renew as a paid subscription through the enabled AutoPay option. The applicable subscription fee will be charged automatically unless you cancel via your UPI app (Google Pay / PhonePe) before the trial period ends.`
      };

      return ApiResponse.success(res, 'Subscription plans retrieved successfully.', {
        plans,
        trialConfig: trialInfo
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/subscriptions/my-status
   * Authenticated endpoint to fetch the current user's subscription membership state
   * Enforces Zero-Grace: if period has ended, instantly terminates subscription access
   */
  static async getMyStatus(req, res, next) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      const activeSub = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['TRIAL', 'ACTIVE', 'CANCELLED'] }
      })
        .populate('planId')
        .sort({ createdAt: -1 });

      const now = new Date();

      // Zero-Grace enforcement: check if subscription has expired
      if (activeSub && activeSub.currentPeriodEnd <= now) {
        activeSub.status = 'EXPIRED';
        await activeSub.save();

        user.isVip = false;
        user.plan = 'Free Tier';
        user.currentSubscriptionId = null;
        await user.save();
      }

      const isVip = Boolean(user.isVip && activeSub && activeSub.status !== 'EXPIRED' && activeSub.currentPeriodEnd > now);

      let daysRemaining = 0;
      if (isVip && activeSub) {
        const diffMs = new Date(activeSub.currentPeriodEnd).getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return ApiResponse.success(res, 'User subscription status retrieved.', {
        isVip,
        planName: isVip ? user.plan : 'Free Tier',
        planCode: activeSub ? activeSub.planCode : null,
        status: activeSub ? activeSub.status : 'EXPIRED',
        isTrial: Boolean(activeSub?.isTrial),
        daysRemaining,
        expiresAt: activeSub ? activeSub.currentPeriodEnd : null,
        autoRenew: Boolean(activeSub?.autoRenew),
        canClaimTrial: !user.hasUsedFreeTrial,
        cancellationNotice: activeSub?.status === 'CANCELLED' ? 'AutoPay mandate was revoked via your UPI app. Subscription access remains active until the end of your current billing period.' : null
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/subscriptions/initiate
   * Authenticated endpoint to create a Razorpay order for either a Rs. 2 trial or direct plan
   */
  static async initiateSubscription(req, res, next) {
    try {
      const { planId, isTrial = false } = req.body;

      if (!planId) {
        return next(new AppError('Plan ID is required.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan || plan.status !== 'ACTIVE') {
        return next(new AppError('The requested subscription plan is not available.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      let amountToCharge = plan.price;
      let orderType = 'NEW_PURCHASE';

      if (isTrial) {
        // Anti-Abuse Rule: 1 trial per phone number
        if (user.hasUsedFreeTrial) {
          return next(
            new AppError(
              'You have already claimed the 7-day free trial on this account. Please select a standard subscription plan.',
              400,
              ERROR_CODES.BAD_REQUEST
            )
          );
        }

        if (!plan.trialEligible) {
          return next(new AppError('This plan is not eligible for the 7-day free trial.', 400, ERROR_CODES.BAD_REQUEST));
        }

        amountToCharge = plan.trialFee || 2;
        orderType = 'TRIAL_TOKEN';
      }

      const amountInPaise = Math.round(amountToCharge * 100);
      const receipt = `esq_sub_${Date.now()}`;

      // Create Razorpay order
      const order = await RazorpayService.createOrder({
        amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          userId: user._id.toString(),
          planId: plan._id.toString(),
          planCode: plan.code,
          isTrial: String(isTrial),
          type: orderType
        }
      });

      return ApiResponse.success(res, 'Payment order initiated successfully.', {
        orderId: order.id,
        amount: amountToCharge,
        amountInPaise,
        currency: 'INR',
        keyId: RazorpayService.getKeyId(),
        plan: {
          id: plan._id,
          name: plan.name,
          code: plan.code,
          price: plan.price,
          durationDays: plan.durationDays
        },
        isTrial
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/subscriptions/verify
   * Authenticated endpoint to verify client-side payment signature and activate subscription immediately
   */
  static async verifySubscription(req, res, next) {
    try {
      const { orderId, paymentId, signature, planId, isTrial = false } = req.body;

      if (!orderId || !paymentId || !planId) {
        return next(new AppError('Payment verification parameters missing.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      // Verify HMAC SHA256 Signature
      const isValidSignature = RazorpayService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature
      });

      if (!isValidSignature) {
        return next(new AppError('Invalid payment signature. Verification failed.', 400, ERROR_CODES.INVALID_CREDENTIALS));
      }

      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return next(new AppError('Plan not found.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return next(new AppError('User not found.', 404, ERROR_CODES.USER_NOT_FOUND));
      }

      const now = new Date();
      let durationDays = plan.durationDays;
      let subscriptionStatus = 'ACTIVE';
      let txType = 'NEW_PURCHASE';
      let trialEndsAt = null;

      if (isTrial) {
        durationDays = plan.trialDays || 7;
        subscriptionStatus = 'TRIAL';
        txType = 'TRIAL_TOKEN';
        trialEndsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Create new Subscription instance
      const subscription = await Subscription.create({
        userId: user._id,
        planId: plan._id,
        planCode: plan.code,
        status: subscriptionStatus,
        isTrial: Boolean(isTrial),
        trialEndsAt,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd,
        autoRenew: true,
        paymentGateway: 'RAZORPAY',
        mandateId: paymentId
      });

      // Update User subscription status
      user.isVip = true;
      user.vipExpiresAt = currentPeriodEnd;
      user.currentSubscriptionId = subscription._id;
      user.plan = plan.name;
      if (isTrial) {
        user.hasUsedFreeTrial = true;
      }
      await user.save();

      // Record immutable transaction in ledger
      await SubscriptionTransaction.create({
        userId: user._id,
        subscriptionId: subscription._id,
        planId: plan._id,
        amount: isTrial ? plan.trialFee : plan.price,
        currency: 'INR',
        type: txType,
        status: 'SUCCESS',
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        gatewaySignature: signature
      });

      return ApiResponse.success(res, 'Subscription verified and Premium membership activated!', {
        isVip: true,
        planName: plan.name,
        planCode: plan.code,
        status: subscriptionStatus,
        isTrial: Boolean(isTrial),
        expiresAt: currentPeriodEnd,
        subscriptionId: subscription._id
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/subscriptions/upgrade
   * Authenticated endpoint: Handles mid-cycle plan upgrade using Time Stacking
   * (e.g. 1M -> 12M: Remaining days of current tier are preserved and added on top)
   */
  static async upgradeSubscription(req, res, next) {
    try {
      const { newPlanId } = req.body;
      if (!newPlanId) {
        return next(new AppError('New plan ID is required for upgrade.', 400, ERROR_CODES.VALIDATION_ERROR));
      }

      const newPlan = await SubscriptionPlan.findById(newPlanId);
      if (!newPlan || newPlan.status !== 'ACTIVE') {
        return next(new AppError('Target upgrade plan is not available.', 404, ERROR_CODES.RESOURCE_NOT_FOUND));
      }

      const user = await User.findById(req.userId);
      const activeSub = await Subscription.findOne({
        userId: user._id,
        status: { $in: ['TRIAL', 'ACTIVE'] }
      }).sort({ createdAt: -1 });

      const now = new Date();
      let remainingDays = 0;

      if (activeSub && activeSub.currentPeriodEnd > now) {
        const diffMs = new Date(activeSub.currentPeriodEnd).getTime() - now.getTime();
        remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      const totalNewDurationDays = remainingDays + newPlan.durationDays;
      const amountInPaise = Math.round(newPlan.price * 100);

      // Create Razorpay order for the new plan
      const order = await RazorpayService.createOrder({
        amountInPaise,
        currency: 'INR',
        receipt: `esq_upg_${Date.now()}`,
        notes: {
          userId: user._id.toString(),
          planId: newPlan._id.toString(),
          planCode: newPlan.code,
          type: 'UPGRADE',
          stackedDays: String(remainingDays)
        }
      });

      return ApiResponse.success(res, 'Upgrade order created with time stacking.', {
        orderId: order.id,
        amount: newPlan.price,
        amountInPaise,
        currency: 'INR',
        keyId: RazorpayService.getKeyId(),
        newPlan: {
          id: newPlan._id,
          name: newPlan.name,
          code: newPlan.code,
          price: newPlan.price,
          durationDays: newPlan.durationDays
        },
        timeStacking: {
          currentRemainingDays: remainingDays,
          newPlanDays: newPlan.durationDays,
          totalNewDays: totalNewDurationDays
        }
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/subscriptions/webhook
   * Razorpay Webhook Listener
   * Handles:
   * 1. subscription.charged / payment.captured: Auto-renew succeeded
   * 2. payment.failed: ZERO GRACE PERIOD -> Immediately locks access and expires plan
   * 3. mandate.revoked / subscription.cancelled: User cancelled mandate from GPay/PhonePe
   */
  static async handleRazorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawPayload = req.body;

      const isValid = RazorpayService.verifyWebhookSignature(rawPayload, signature);
      if (!isValid) {
        console.warn('[Webhook] Invalid Razorpay webhook signature received.');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }

      const event = rawPayload.event;
      console.log(`[Webhook] Razorpay event received: ${event}`);

      const payloadData = rawPayload.payload || {};
      const paymentEntity = payloadData.payment?.entity || {};
      const subscriptionEntity = payloadData.subscription?.entity || {};

      // 1. RECURRING AUTO-DEBIT SUCCEEDED
      if (event === 'subscription.charged' || event === 'payment.captured') {
        const subId = subscriptionEntity.id || paymentEntity.description;
        const sub = await Subscription.findOne({
          $or: [{ razorpaySubscriptionId: subId }, { mandateId: subId }]
        }).populate('planId');

        if (sub) {
          const now = new Date();
          const durationDays = sub.planId?.durationDays || 30;
          const newPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          sub.status = 'ACTIVE';
          sub.isTrial = false;
          sub.currentPeriodStart = now;
          sub.currentPeriodEnd = newPeriodEnd;
          await sub.save();

          await User.findByIdAndUpdate(sub.userId, {
            isVip: true,
            vipExpiresAt: newPeriodEnd
          });

          await SubscriptionTransaction.create({
            userId: sub.userId,
            subscriptionId: sub._id,
            planId: sub.planId._id,
            amount: (paymentEntity.amount || 9900) / 100,
            currency: 'INR',
            type: 'AUTOPAY_RENEWAL',
            status: 'SUCCESS',
            gatewayPaymentId: paymentEntity.id,
            rawWebhookEvent: rawPayload
          });

          console.log(`[Webhook] Renewed subscription for user ${sub.userId} until ${newPeriodEnd}`);
        }
      }

      // 2. PAYMENT FAILED (ZERO GRACE PERIOD - IMMEDIATE EXPIRY)
      if (event === 'payment.failed' || event === 'subscription.halted') {
        const subId = subscriptionEntity.id || paymentEntity.description;
        const sub = await Subscription.findOne({
          $or: [{ razorpaySubscriptionId: subId }, { mandateId: subId }]
        });

        if (sub) {
          // Zero Grace Period: Immediate expiry!
          sub.status = 'EXPIRED';
          sub.autoRenew = false;
          await sub.save();

          // Immediately revoke subscription access
          await User.findByIdAndUpdate(sub.userId, {
            isVip: false,
            plan: 'Free Tier',
            currentSubscriptionId: null
          });

          await SubscriptionTransaction.create({
            userId: sub.userId,
            subscriptionId: sub._id,
            planId: sub.planId,
            amount: (paymentEntity.amount || 0) / 100,
            currency: 'INR',
            type: 'AUTOPAY_RENEWAL',
            status: 'FAILED',
            gatewayPaymentId: paymentEntity.id,
            failureReason: paymentEntity.error_description || 'Bank payment declined',
            rawWebhookEvent: rawPayload
          });

          console.log(`[Webhook] Immediate lock applied: User ${sub.userId} subscription expired due to payment failure.`);
        }
      }

      // 3. USER CANCELLED MANDATE FROM GPAY / PHONEPE / PAYTM
      if (event === 'subscription.cancelled' || event === 'mandate.revoked') {
        const subId = subscriptionEntity.id || payloadData.mandate?.entity?.id;
        const sub = await Subscription.findOne({
          $or: [{ razorpaySubscriptionId: subId }, { mandateId: subId }]
        });

        if (sub) {
          // Future debits stopped, access preserved until currentPeriodEnd
          sub.autoRenew = false;
          sub.status = 'CANCELLED';
          sub.cancelledAt = new Date();
          sub.cancellationSource = 'UPI_APP_REVOKE';
          await sub.save();

          console.log(`[Webhook] AutoPay mandate cancelled via UPI app for user ${sub.userId}. Access continues until ${sub.currentPeriodEnd}`);
        }
      }

      return res.status(200).json({ success: true, received: true });
    } catch (err) {
      console.error('[Webhook] Error handling Razorpay webhook:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
