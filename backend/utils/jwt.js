import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const REFRESH_SECRET = env.JWT_SECRET + '_refresh_secret_key';

/**
 * Generate a signed JWT access token
 * @param {object} payload - Token payload
 * @param {string|number} [expiresIn] - Expiration override (default: '7d')
 * @returns {string} Signed JWT
 */
export const signJwt = (payload, expiresIn = env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Verify and decode a JWT access token
 * @param {string} token
 * @param {boolean} [ignoreExpiration=false]
 * @returns {object} Decoded payload
 */
export const verifyJwt = (token, ignoreExpiration = false) => {
  return jwt.verify(token, env.JWT_SECRET, { ignoreExpiration });
};

/**
 * Generate a long-lived refresh token
 * @param {object} payload - Token payload
 * @param {string|number} [expiresIn='30d']
 * @returns {string} Signed Refresh JWT
 */
export const signRefreshToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn
  });
};

/**
 * Verify and decode a refresh token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

/**
 * Decode token payload safely for refresh workflows
 * Supports dedicated refresh tokens, active access tokens, and safely expired access tokens
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const decodeTokenForRefresh = (token) => {
  // 1. Try verifying as dedicated refresh token
  try {
    return verifyRefreshToken(token);
  } catch (refreshErr) {
    // 2. If not refresh token, try verifying as standard access token
    try {
      return verifyJwt(token);
    } catch (accessErr) {
      if (accessErr.name === 'TokenExpiredError') {
        // Access token signature is valid, but expired — safely allow refresh
        return jwt.verify(token, env.JWT_SECRET, { ignoreExpiration: true });
      }
      throw accessErr;
    }
  }
};
