import { Router } from 'express';
import { SubscriptionAdminController } from '../controllers/subscriptionAdmin.controller.js';

const router = Router();

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN SUBSCRIPTION MANAGEMENT ROUTES (/api/v1/subscriptions/admin)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Overview & Monetization KPIs
router.get('/overview', SubscriptionAdminController.getOverview);

// Plans Management (CRUD)
router.get('/plans', SubscriptionAdminController.getPlans);
router.post('/plans', SubscriptionAdminController.createPlan);
router.put('/plans/:id', SubscriptionAdminController.updatePlan);
router.delete('/plans/:id', SubscriptionAdminController.deletePlan);

// 7-Day Free Trial AutoPay Configuration
router.get('/trial-settings', SubscriptionAdminController.getTrialSettings);
router.put('/trial-settings', SubscriptionAdminController.updateTrialSettings);

// Transactions & Orders Ledger
router.get('/transactions', SubscriptionAdminController.getTransactions);

// Active & Trial Subscribers List & Manual Override
router.get('/subscribers', SubscriptionAdminController.getSubscribers);
router.patch('/subscribers/:id/override', SubscriptionAdminController.overrideSubscriberVip);

export default router;
