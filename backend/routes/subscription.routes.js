import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller.js';
import subscriptionAdminRoutes from './subscriptionAdmin.routes.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN SUBSCRIPTION ROUTES (/api/v1/subscriptions/admin)
 * ─────────────────────────────────────────────────────────────────────────────
 */
router.use('/admin', subscriptionAdminRoutes);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MOBILE APP SUBSCRIPTION ROUTES
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Public: Get active plans & 7-day free trial parameters for the paywall
 * @access  Public
 */
router.get('/plans', SubscriptionController.getPlans);

/**
 * @route   GET /api/subscriptions/my-status
 * @desc    Authenticated: Get current user's subscription membership status & remaining days
 * @access  Private (User JWT)
 */
router.get('/my-status', authenticate, SubscriptionController.getMyStatus);

/**
 * @route   POST /api/subscriptions/initiate
 * @desc    Authenticated: Create a Razorpay order for Rs. 2 trial or direct plan
 * @access  Private (User JWT)
 */
router.post('/initiate', authenticate, SubscriptionController.initiateSubscription);

/**
 * @route   POST /api/subscriptions/verify
 * @desc    Authenticated: Verify client payment signature & activate subscription pass instantly
 * @access  Private (User JWT)
 */
router.post('/verify', authenticate, SubscriptionController.verifySubscription);

/**
 * @route   POST /api/subscriptions/upgrade
 * @desc    Authenticated: Upgrade to a higher tier with Time Stacking calculation
 * @access  Private (User JWT)
 */
router.post('/upgrade', authenticate, SubscriptionController.upgradeSubscription);

/**
 * @route   POST /api/subscriptions/webhook
 * @desc    Razorpay Webhook: Handles renewals, immediate failure locks, & UPI app revocations
 * @access  Webhook Signature
 */
router.post('/webhook', SubscriptionController.handleRazorpayWebhook);

export default router;
