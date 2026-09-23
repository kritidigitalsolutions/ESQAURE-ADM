import { AppError } from '../utils/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * Middleware factory for request validation using Joi schemas
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} [property='body']
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return next(
        new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR, errorDetails)
      );
    }

    // Attach sanitized and validated values back to request
    req[property] = value;
    return next();
  };
};
