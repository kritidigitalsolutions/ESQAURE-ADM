import Joi from 'joi';
import { REGEX } from '../constants/regex.js';

export const authValidation = {
  // Screen 1: Request OTP
  requestOtp: Joi.object({
    phoneNumber: Joi.string()
      .pattern(REGEX.PHONE_DIGITS_ONLY)
      .required()
      .messages({
        'string.empty': 'Phone number is required.',
        'string.pattern.base': 'Please enter a valid phone number (digits only).'
      }),
    countryCode: Joi.string()
      .pattern(REGEX.COUNTRY_CODE)
      .default('+91')
      .messages({
        'string.pattern.base': 'Please enter a valid country code (e.g. +91).'
      })
  }),

  // Screen 2: Verify 4-digit OTP
  verifyOtp: Joi.object({
    phoneNumber: Joi.string()
      .pattern(REGEX.PHONE_DIGITS_ONLY)
      .required()
      .messages({
        'string.empty': 'Phone number is required.',
        'string.pattern.base': 'Please enter a valid phone number.'
      }),
    countryCode: Joi.string()
      .pattern(REGEX.COUNTRY_CODE)
      .default('+91'),
    otp: Joi.string()
      .pattern(REGEX.FOUR_DIGIT_OTP)
      .required()
      .messages({
        'string.empty': 'Please enter the 4-digit OTP.',
        'string.pattern.base': 'OTP must be a 4-digit numeric code.'
      })
  }),

  // Screen 2: Resend OTP
  resendOtp: Joi.object({
    phoneNumber: Joi.string()
      .pattern(REGEX.PHONE_DIGITS_ONLY)
      .required()
      .messages({
        'string.empty': 'Phone number is required.'
      }),
    countryCode: Joi.string()
      .pattern(REGEX.COUNTRY_CODE)
      .default('+91')
  }),

  // Screen 3: Complete Profile (First name, Last name, Email address)
  completeProfile: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'First name is required.',
        'any.required': 'First name is required.'
      }),
    lastName: Joi.string()
      .trim()
      .allow('', null)
      .max(50)
      .default(''),
    email: Joi.string()
      .trim()
      .email()
      .allow('', null)
      .messages({
        'string.email': 'Please enter a valid email address.'
      }),
    interests: Joi.array()
      .items(Joi.string().trim())
      .default([])
  }),

  // Choose your Interest (Screen 4 / Onboarding genres)
  saveInterests: Joi.object({
    interests: Joi.array()
      .items(Joi.string().trim())
      .default([])
      .messages({
        'array.base': 'Interests must be an array of genre IDs or slugs.'
      })
  }),

  // Refresh Token
  refreshToken: Joi.object({
    refreshToken: Joi.string().trim().optional(),
    token: Joi.string().trim().optional()
  })
};
