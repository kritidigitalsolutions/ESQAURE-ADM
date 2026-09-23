import { verifyJwt } from '../utils/jwt.js';
import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { User } from '../models/User.js';

/**
 * Middleware to authenticate requests using Bearer JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError(
          'Authentication required. Please provide a valid Bearer token.',
          401,
          ERROR_CODES.AUTH_REQUIRED
        )
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(
          new AppError('Token has expired. Please login again.', 401, ERROR_CODES.TOKEN_EXPIRED)
        );
      }
      return next(
        new AppError('Invalid authentication token.', 401, ERROR_CODES.INVALID_TOKEN)
      );
    }

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(
        new AppError('User belonging to this token no longer exists.', 401, ERROR_CODES.USER_NOT_FOUND)
      );
    }

    if (user.status === 'SUSPENDED') {
      return next(
        new AppError('This account has been suspended. Please contact support.', 403, ERROR_CODES.ACCOUNT_SUSPENDED)
      );
    }

    if (user.status === 'DELETED') {
      return next(
        new AppError('This account has been deleted. Please register or login again.', 401, ERROR_CODES.USER_NOT_FOUND)
      );
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id.toString();
    return next();
  } catch (error) {
    return next(error);
  }
};
