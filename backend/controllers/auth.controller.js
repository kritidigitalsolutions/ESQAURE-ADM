import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Genre } from '../models/Genre.js';
import { Otp } from '../models/Otp.js';
import { OtpService } from '../utils/otpService.js';
import { signJwt, signRefreshToken, decodeTokenForRefresh } from '../utils/jwt.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { isDev } from '../config/env.js';

/**
 * Helper to resolve genre IDs from either ObjectIds or slugs/names
 * @param {Array<string>} interestInput
 * @returns {Promise<Array<mongoose.Types.ObjectId>>}
 */
const resolveGenreIds = async (interestInput) => {
  if (!Array.isArray(interestInput) || interestInput.length === 0) {
    return [];
  }

  const objectIds = [];
  const slugsOrNames = [];

  for (const item of interestInput) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (mongoose.Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
        objectIds.push(new mongoose.Types.ObjectId(trimmed));
      } else {
        slugsOrNames.push(trimmed.toLowerCase());
      }
    }
  }

  const queries = [];
  if (objectIds.length > 0) queries.push({ _id: { $in: objectIds } });
  if (slugsOrNames.length > 0) {
    queries.push({ slug: { $in: slugsOrNames } });
  }

  if (queries.length === 0) return [];

  const matchedGenres = await Genre.find({ $or: queries, isActive: true }).select('_id');
  return matchedGenres.map((g) => g._id);
};

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

      const isExistingUser = !!(
        existingUser &&
        existingUser.isProfileCompleted &&
        existingUser.status === 'ACTIVE'
      );

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

        // Reactivate account if it was previously deleted
        if (user.status === 'DELETED') {
          user.status = 'ACTIVE';
          user.firstName = '';
          user.lastName = '';
          user.email = null;
          user.interests = [];
          user.isProfileCompleted = false;
          user.isVip = false;
          user.vipExpiresAt = null;
          isNewUser = true;
        }

        user.lastLoginAt = new Date();
        await user.save();

        // If profile was not completed previously, treat as new user flow (Screen 3)
        if (!user.isProfileCompleted) {
          isNewUser = true;
        }
      }

      // 4. Generate JWT access token & refresh token
      const token = signJwt({
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        isProfileCompleted: user.isProfileCompleted
      });

      const refreshToken = signRefreshToken({
        userId: user._id.toString()
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
          refreshToken,
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

      // If interests array is provided, resolve and set them
      if (req.body.interests && Array.isArray(req.body.interests) && req.body.interests.length > 0) {
        user.interests = await resolveGenreIds(req.body.interests);
      }

      // Update profile fields
      user.firstName = firstName.trim();
      user.lastName = (lastName || '').trim();
      user.isProfileCompleted = true;

      await user.save();
      await user.populate('interests', 'name slug icon iconUrl imageUrl');

      // Issue refreshed JWT with isProfileCompleted: true
      const token = signJwt({
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        isProfileCompleted: true
      });

      const refreshToken = signRefreshToken({
        userId: user._id.toString()
      });

      const userPayload = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        interests: user.interests,
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
          refreshToken,
          user: userPayload
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Screen 4: Fetch Active Genres for "Choose your Interest" onboarding
   * GET /api/v1/auth/genres
   */
  static async getGenres(req, res, next) {
    try {
      const genres = await Genre.find({ isActive: true })
        .sort({ displayOrder: 1, name: 1 })
        .select('name slug icon iconUrl imageUrl displayOrder')
        .lean();

      return ApiResponse.success(
        res,
        'Genres retrieved successfully',
        { genres },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Screen 4: Save Selected Genres ("Choose your Interest" onboarding)
   * POST /api/v1/auth/interests
   */
  static async saveInterests(req, res, next) {
    try {
      const { interests = [] } = req.body;
      const user = req.user;

      const genreIds = await resolveGenreIds(interests);
      user.interests = genreIds;
      await user.save();

      await user.populate('interests', 'name slug icon iconUrl imageUrl');

      return ApiResponse.success(
        res,
        'Interests saved successfully',
        {
          interests: user.interests,
          user: {
            id: user._id,
            phoneNumber: user.phoneNumber,
            countryCode: user.countryCode,
            fullName: user.fullName,
            email: user.email,
            interests: user.interests,
            isProfileCompleted: user.isProfileCompleted
          }
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
      await user.populate('interests', 'name slug icon iconUrl imageUrl');

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

  /**
   * Delete User Account / Profile
   * DELETE /api/v1/auth/profile
   * POST /api/v1/auth/delete-account
   * @access Private (Bearer JWT)
   */
  static async deleteAccount(req, res, next) {
    try {
      const user = req.user;
      const { hardDelete = false } = req.query;

      // Clean up any remaining OTP records for this phone number
      await Otp.deleteMany({ phoneNumber: user.phoneNumber });

      if (hardDelete === 'true' || hardDelete === true) {
        await User.findByIdAndDelete(user._id);
        return ApiResponse.success(
          res,
          'Account permanently deleted.',
          { deleted: true, hardDelete: true },
          200
        );
      }

      // Soft delete: set status to DELETED, reset profile, clear tokens & VIP
      user.status = 'DELETED';
      user.isProfileCompleted = false;
      user.fcmTokens = [];
      user.isVip = false;
      user.vipExpiresAt = null;
      await user.save();

      return ApiResponse.success(
        res,
        'Account deleted successfully. We are sorry to see you go!',
        {
          deleted: true,
          status: 'DELETED',
          userId: user._id
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Refresh authentication token
   * @route   POST /api/v1/auth/refresh-token
   * @desc    Generates fresh access token and refresh token using existing token or refresh token
   * @access  Public / Bearer JWT
   */
  static async refreshToken(req, res, next) {
    try {
      // 1. Extract token from request body (refreshToken / token) or Authorization header
      let tokenToVerify = req.body?.refreshToken || req.body?.token;

      if (!tokenToVerify && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        tokenToVerify = req.headers.authorization.split(' ')[1];
      }

      if (!tokenToVerify) {
        return ApiResponse.error(
          res,
          'Refresh token is required. Please provide it in request body (refreshToken) or Authorization Bearer header.',
          ERROR_CODES.AUTH_REQUIRED,
          400
        );
      }

      // 2. Decode and verify token safely
      let decoded;
      try {
        decoded = decodeTokenForRefresh(tokenToVerify);
      } catch (err) {
        return ApiResponse.error(
          res,
          'Invalid or corrupted token provided. Please log in again.',
          ERROR_CODES.INVALID_TOKEN,
          401
        );
      }

      const userId = decoded.userId || decoded.id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return ApiResponse.error(
          res,
          'Invalid token payload.',
          ERROR_CODES.INVALID_TOKEN,
          401
        );
      }

      // 3. Find user and verify active status
      const user = await User.findById(userId);
      if (!user) {
        return ApiResponse.error(
          res,
          'User associated with this token does not exist.',
          ERROR_CODES.USER_NOT_FOUND,
          404
        );
      }

      if (user.status !== 'ACTIVE') {
        return ApiResponse.error(
          res,
          `Account is currently ${user.status.toLowerCase()}. Access denied.`,
          ERROR_CODES.ACCOUNT_SUSPENDED,
          403
        );
      }

      // 4. Issue new fresh access token & refresh token
      const newToken = signJwt({
        userId: user._id.toString(),
        phoneNumber: user.phoneNumber,
        isProfileCompleted: user.isProfileCompleted
      });

      const newRefreshToken = signRefreshToken({
        userId: user._id.toString()
      });

      const userPayload = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        countryCode: user.countryCode,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: user.fullName || '',
        email: user.email || null,
        isProfileCompleted: user.isProfileCompleted,
        isVip: user.isVip || false,
        vipExpiresAt: user.vipExpiresAt || null,
        avatarUrl: user.avatarUrl || '',
        status: user.status
      };

      return ApiResponse.success(
        res,
        'Token refreshed successfully.',
        {
          token: newToken,
          refreshToken: newRefreshToken,
          user: userPayload
        },
        200
      );
    } catch (error) {
      return next(error);
    }
  }
}

