import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a signed JWT token
 * @param {object} payload - Token payload
 * @param {string|number} [expiresIn] - Expiration override (e.g. '7d')
 * @returns {string} Signed JWT
 */
export const signJwt = (payload, expiresIn = env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyJwt = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};
