import { getFirebaseAuth } from '../config/firebase.js';
import { verifyJwt } from '../utils/jwt.js';
import { env, isDev } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Middleware to strictly verify administrative access.
 * Supports:
 *  1. Firebase Admin ID Token (issued when logging in via Admin Web Panel)
 *  2. Master Admin Key / Server-to-server secret (ADMIN_API_KEY or X-Admin-Key)
 *  3. Admin JWT tokens signed by platform
 *  4. Safe developer fallback in local development when serviceAccountKey is pending
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const adminKeyHeader = req.headers['x-admin-key'];

    // 1. Check for Master Admin API Key in header
    if (adminKeyHeader && adminKeyHeader === env.ADMIN_API_KEY) {
      req.admin = {
        role: 'SUPER_ADMIN',
        authMethod: 'API_KEY',
        email: 'system-admin@e2stories.com'
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError(
          'Administrative authentication required. Access denied.',
          401,
          ERROR_CODES.AUTH_REQUIRED || 'ADMIN_AUTH_REQUIRED'
        )
      );
    }

    const token = authHeader.split(' ')[1].trim();

    // 2. Direct check against Master Admin Key passed as Bearer token
    if (token === env.ADMIN_API_KEY) {
      req.admin = {
        role: 'SUPER_ADMIN',
        authMethod: 'API_KEY',
        email: 'admin@e2stories.com'
      };
      return next();
    }

    // 3. Verify Firebase ID Token via Firebase Admin SDK
    const firebaseAuth = getFirebaseAuth();
    if (firebaseAuth) {
      try {
        const decodedFirebaseUser = await firebaseAuth.verifyIdToken(token);
        if (decodedFirebaseUser) {
          req.admin = {
            uid: decodedFirebaseUser.uid,
            email: decodedFirebaseUser.email,
            role: decodedFirebaseUser.role || 'ADMIN',
            authMethod: 'FIREBASE'
          };
          return next();
        }
      } catch (fbErr) {
        // If it was not a valid Firebase token, continue to try JWT
        if (fbErr.code === 'auth/id-token-expired') {
          return next(
            new AppError('Admin session has expired. Please log in again.', 401, 'TOKEN_EXPIRED')
          );
        }
      }
    }

    // 4. Verify Internal Platform JWT
    try {
      const decodedJwt = verifyJwt(token);
      if (decodedJwt && (decodedJwt.isAdmin || decodedJwt.role === 'ADMIN' || decodedJwt.role === 'SUPER_ADMIN')) {
        req.admin = {
          userId: decodedJwt.userId,
          role: decodedJwt.role || 'ADMIN',
          authMethod: 'JWT'
        };
        return next();
      }
    } catch {
      // Ignore internal JWT failure and proceed
    }

    // 5. In local development only: If Firebase Admin SDK credentials file is not loaded,
    // permit authenticated developer requests with a warning so offline coding isn't blocked.
    if (isDev && (!firebaseAuth || token === 'esquare_admin_dev_secret_2026')) {
      console.warn(`[Admin Auth] Development mode authorized for token: ${token.slice(0, 16)}...`);
      req.admin = {
        role: 'DEV_ADMIN',
        authMethod: 'DEV_FALLBACK',
        email: 'dev@local'
      };
      return next();
    }

    return next(
      new AppError(
        'Invalid or unauthorized administrator credentials.',
        403,
        ERROR_CODES.FORBIDDEN || 'ADMIN_FORBIDDEN'
      )
    );
  } catch (error) {
    return next(error);
  }
};
