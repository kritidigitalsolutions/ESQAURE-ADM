import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Rate limiter for OTP generation to avoid SMS flood and abuse
 * Allows 5 OTP requests per 10 minutes per IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many OTP requests from this network. Please try again after 10 minutes.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  }
});

/**
 * General auth endpoints limiter (verify, login)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again later.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  }
});
