import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authValidation } from '../validations/auth.validation.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { otpRateLimiter, authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC ROUTES  (no token required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/request-otp
 * Screen 1: Send 4-digit OTP to mobile number
 */
router.post('/request-otp', otpRateLimiter, validate(authValidation.requestOtp), AuthController.requestOtp);

/**
 * POST /api/v1/auth/resend-otp
 * Screen 1: Resend OTP (after 60s cooldown)
 */
router.post('/resend-otp', otpRateLimiter, validate(authValidation.resendOtp), AuthController.resendOtp);

/**
 * POST /api/v1/auth/verify-otp
 * Screen 2: Verify OTP → returns token + refreshToken
 */
router.post('/verify-otp', authRateLimiter, validate(authValidation.verifyOtp), AuthController.verifyOtp);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh expired access token using a refresh token
 */
router.post('/refresh-token', validate(authValidation.refreshToken), AuthController.refreshToken);

/**
 * GET /api/v1/auth/genres
 * Fetch active genres for the "Choose Your Interest" onboarding screen
 */
router.get('/genres', AuthController.getGenres);

// ─────────────────────────────────────────────────────────────────────────────
//  PRIVATE ROUTES  (Bearer JWT required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/auth/me
 * Fetch the currently authenticated user's full profile
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * POST /api/v1/auth/profile
 * Screen 3: First-time profile setup (firstName, lastName, email)
 */
router.post('/profile', authenticate, validate(authValidation.completeProfile), AuthController.completeProfile);

/**
 * PUT /api/v1/auth/profile
 * Edit Profile screen: update name, email, avatar, interests
 */
router.put('/profile', authenticate, validate(authValidation.editProfile), AuthController.editProfile);

/**
 * PATCH /api/v1/auth/profile
 * Same as PUT — partial update supported
 */
router.patch('/profile', authenticate, validate(authValidation.editProfile), AuthController.editProfile);

/**
 * POST /api/v1/auth/interests
 * Screen 4: Save selected genre preferences
 */
router.post('/interests', authenticate, validate(authValidation.saveInterests), AuthController.saveInterests);

/**
 * POST /api/v1/auth/logout
 * Invalidate current session
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * DELETE /api/v1/auth/profile
 * POST   /api/v1/auth/delete-account
 * POST   /api/v1/auth/delete-request
 * Submit account deletion request to admin (24-hour verification SLA)
 */
router.delete('/profile', authenticate, validate(authValidation.requestAccountDeletion), AuthController.deleteAccount);
router.post('/delete-account', authenticate, validate(authValidation.requestAccountDeletion), AuthController.deleteAccount);
router.post('/delete-request', authenticate, validate(authValidation.requestAccountDeletion), AuthController.deleteAccount);

/**
 * POST /api/v1/auth/cancel-delete-request
 * Cancel pending account deletion request and restore active status
 */
router.post('/cancel-delete-request', authenticate, AuthController.cancelDeleteRequest);

export default router;
