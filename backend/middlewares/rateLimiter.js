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

/**
 * Global API rate limiter protecting endpoints against scraping and flood attacks
 * Allows 500 requests per 15 minutes per IP (skips health check & media)
 */
export const apiGlobalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health' || req.path.startsWith('/uploads');
  },
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'Too many requests from this network. Please slow down and try again shortly.',
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      429
    );
  }
});

