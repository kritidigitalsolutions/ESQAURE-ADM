import { ApiResponse } from '../utils/apiResponse.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { isDev } from '../config/env.js';

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || ERROR_CODES.INTERNAL_ERROR;
  let message = err.message || 'An unexpected internal server error occurred.';
  let details = err.details || null;

  // Handle Mongoose duplicate key error (e.g. unique email or phone)
  if (err.code === 11000) {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Handle CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = `Invalid identifier format: ${err.value}`;
  }

  // Handle JSON parse syntax errors in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    message = 'Malformed JSON payload provided.';
  }

  if (isDev && statusCode === 500) {
    console.error('[Unhandled Server Exception]:', err);
  }

  return ApiResponse.error(
    res,
    message,
    errorCode,
    statusCode,
    isDev && statusCode === 500 ? { stack: err.stack } : details
  );
};
