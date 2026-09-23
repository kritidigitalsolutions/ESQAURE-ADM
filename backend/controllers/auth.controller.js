import { User } from '../models/User.js';
import { OtpService } from '../utils/otpService.js';
import { signJwt } from '../utils/jwt.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { isDev } from '../config/env.js';

export class AuthController {
  /**
   * Screen 1: Request 4-digit OTP for Mobile Number
   * POST /api/v1/auth/request-otp
   */
  static async requestOtp(req, res, next) {
    try {
      const { phoneNumber, countryCode = '+91' } = req.body;
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // Check if user exists in database
      const existingUser = await User.findOne({
        phoneNumber: cleanPhone,
        countryCode
      });

      const isExistingUser = !!(existingUser && existingUser.isProfileCompleted);

      // Generate and store OTP (with 60s cooldown check)
      const otpResult = await OtpService.requestOtp(cleanPhone, countryCode);

      const responseData = {
        phoneNumber: cleanPhone,
        countryCode,
        formattedNumber: otpResult.formattedNumber,
        maskedNumber: otpResult.maskedNumber,
        isExistingUser,
        resendAfterSeconds: otpResult.resendAfterSeconds,
        otpExpiresInSeconds: otpResult.expiresInSeconds
      };

      // In dev mode, return OTP directly in response for fast developer testing
      if (isDev) {
        responseData.devOtp = otpResult.otp;
      }

      return ApiResponse.success(
        res,
        `OTP sent successfully to ${otpResult.maskedNumber}`,
        responseData,
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Screen 2: Resend 4-digit OTP
   * POST /api/v1/auth/resend-otp
   */
  static async resendOtp(req, res, next) {
    try {
      const { phoneNumber, countryCode = '+91' } = req.body;
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      const otpResult = await OtpService.requestOtp(cleanPhone, countryCode);

      const responseData = {
        phoneNumber: cleanPhone,
        countryCode,
        maskedNumber: otpResult.maskedNumber,
        resendAfterSeconds: otpResult.resendAfterSeconds,
        otpExpiresInSeconds: otpResult.expiresInSeconds
      };

      if (isDev) {
        responseData.devOtp = otpResult.otp;
      }

      return ApiResponse.success(
        res,
        `New OTP sent successfully to ${otpResult.maskedNumber}`,
        responseData,
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Screen 2: Verify 4-digit OTP (Handles both New and Existing User Flows)
   * POST /api/v1/auth/verify-otp
   */
  static async verifyOtp(req, res, next) {
    try {
      const { phoneNumber, countryCode = '+91', otp } = req.body;
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // 1. Verify OTP code
      await OtpService.verifyOtp(cleanPhone, countryCode, otp);

      // 2. Query for existing user
      let user = await User.findOne({
        phoneNumber: cleanPhone,
        countryCode
      });

      let isNewUser = false;

      // 3. User does not exist -> Create preliminary record for new user
      if (!user) {
        isNewUser = true;
        user = await User.create({
          phoneNumber: cleanPhone,
          countryCode,
          isProfileCompleted: false,
          status: 'ACTIVE',
          lastLoginAt: new Date()
        });
      } else {
        // User exists: check status and update last login
        if (user.status === 'SUSPENDED') {
          throw new AppError(
            'Your account is suspended. Please contact support.',
            403,
            ERROR_CODES.ACCOUNT_SUSPENDED
          );
        }

        user.lastLoginAt = new Date();
        await user.save();

        // If profile was not completed previously, treat as new user flow (Screen 3)
        if (!user.isProfileCompleted) {
          isNewUser = true;
        }
      }

      // 4. Generate JWT access token
      const token = signJwt({
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        isProfileCompleted: user.isProfileCompleted
      });

      // 5. Structure user payload
      const userPayload = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: user.fullName || '',
        email: user.email || null,
        isVip: user.isVip || false,
        vipExpiresAt: user.vipExpiresAt || null,
        avatarUrl: user.avatarUrl || '',
        status: user.status
      };

      const message = isNewUser
        ? 'OTP verified successfully. Please complete your profile.'
        : 'Login successful. Welcome back!';

      return ApiResponse.success(
        res,
        message,
        {
          isNewUser,
          isProfileCompleted: user.isProfileCompleted,
          token,
          user: userPayload
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Screen 3: Complete / Update Profile (First name, Last name, Email address)
   * POST /api/v1/auth/profile
   */
  static async completeProfile(req, res, next) {
    try {
      const { firstName, lastName = '', email } = req.body;
      const user = req.user;

      // If email is provided, verify it is not already used by another user
      if (email && email.trim()) {
        const normalizedEmail = email.trim().toLowerCase();
        const existingEmailUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id }
        });

        if (existingEmailUser) {
          throw new AppError(
            'This email address is already associated with another account.',
            400,
            ERROR_CODES.EMAIL_ALREADY_EXISTS
          );
        }

        user.email = normalizedEmail;
      }

      // Update profile fields
      user.firstName = firstName.trim();
      user.lastName = (lastName || '').trim();
      user.isProfileCompleted = true;

      await user.save();

      // Issue refreshed JWT with isProfileCompleted: true
      const token = signJwt({
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        isProfileCompleted: true
      });

      const userPayload = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        isVip: user.isVip,
        vipExpiresAt: user.vipExpiresAt,
        avatarUrl: user.avatarUrl,
        status: user.status
      };

      return ApiResponse.success(
        res,
        'Profile completed successfully. Welcome to Entertainment Squared!',
        {
          isNewUser: false,
          isProfileCompleted: true,
          token,
          user: userPayload
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Fetch authenticated user's current session & profile
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const user = req.user;

      return ApiResponse.success(
        res,
        'User profile retrieved successfully',
        {
          user: {
            id: user._id,
            phoneNumber: user.phoneNumber,
            countryCode: user.countryCode,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            isVip: user.isVip,
            vipExpiresAt: user.vipExpiresAt,
            avatarUrl: user.avatarUrl,
            interests: user.interests,
            preferredContentLanguages: user.preferredContentLanguages,
            settings: user.settings,
            status: user.status,
            isProfileCompleted: user.isProfileCompleted,
            createdAt: user.createdAt
          }
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Log out session
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      return ApiResponse.success(
        res,
        'Successfully logged out.',
        null,
        200
      );
    } catch (error) {
      return next(error);
    }
  }
}
