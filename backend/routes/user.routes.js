import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { verifyAdmin } from '../middlewares/adminAuth.middleware.js';

const router = Router();

// Protect all user management endpoints with Admin Authentication
router.use(verifyAdmin);


/**
 * GET /api/v1/users
 * List all users with search, filters (ALL | SUBSCRIBED | FREE | SUSPENDED), and KPI stats
 * Query: ?search=&filter=ALL&page=1&limit=100
 */
router.get('/', UserController.getUsers);

/**
 * GET /api/v1/users/admin/activity-analytics
 * Get dynamic activity telemetry derived from real database users and subscriptions
 */
router.get('/admin/activity-analytics', UserController.getActivityAnalytics);

/**
 * GET /api/v1/users/:id
 * Get a single user's full profile and details
 */
router.get('/:id', UserController.getUserById);

/**
 * PATCH /api/v1/users/:id
 * Update user profile details (firstName, lastName, email, phone, promoCode, avatarUrl)
 */
router.patch('/:id', UserController.updateUser);

/**
 * PATCH /api/v1/users/:id/status
 * Activate or suspend a user account
 * Body: { "status": "ACTIVE" | "SUSPENDED" }  — omit to toggle
 */
router.patch('/:id/status', UserController.updateUserStatus);

/**
 * PATCH /api/v1/users/:id/vip
 * Grant or revoke subscription access
 * Body: { "isVip": true, "days": 30, "planName": "Monthly Pass" }
 */
router.patch('/:id/vip', UserController.updateUserVip);

/**
 * DELETE /api/v1/users/:id
 * Permanently delete a user record from the database
 */
router.delete('/:id', UserController.deleteUser);

export default router;
