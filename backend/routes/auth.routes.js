import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authValidation } from '../validations/auth.validation.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { otpRateLimiter, authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

/**
 * @route   POST /api/v1/auth/request-otp
 * @desc    Screen 1: Request 4-digit OTP for phone number
 * @access  Public
 */
router.post(
  '/request-otp',
  otpRateLimiter,
  validate(authValidation.requestOtp),
  AuthController.requestOtp
);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Screen 2: Resend 4-digit OTP
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimiter,
  validate(authValidation.resendOtp),
  AuthController.resendOtp
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Screen 2: Verify 4-digit OTP (Login for existing user or Step 1 for new user)
 * @access  Public
 */
router.post(
  '/verify-otp',
  authRateLimiter,
  validate(authValidation.verifyOtp),
  AuthController.verifyOtp
);

/**
 * @route   POST /api/v1/auth/profile
 * @desc    Screen 3: Welcome to Entertainment Squared (first name, last name, email)
 * @access  Private (Bearer JWT)
 */
router.post(
  '/profile',
  authenticate,
  validate(authValidation.completeProfile),
  AuthController.completeProfile
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently logged in user profile & VIP status
 * @access  Private (Bearer JWT)
 */
router.get(
  '/me',
  authenticate,
  AuthController.getMe
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout active session
 * @access  Private (Bearer JWT)
 */
router.post(
  '/logout',
  authenticate,
  AuthController.logout
);

export default router;
