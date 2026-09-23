/**
 * Common regular expressions used for validation across E² Stories Backend
 */
export const REGEX = {
  // Indian 10-digit mobile number starting with 6, 7, 8, or 9
  INDIA_PHONE: /^[6-9]\d{9}$/,

  // Generic 7-15 digit mobile number without special symbols
  PHONE_DIGITS_ONLY: /^\d{7,15}$/,

  // Country code with optional leading plus (e.g. +91, 91, +1, +44)
  COUNTRY_CODE: /^\+?[1-9]\d{0,3}$/,

  // 4-digit numeric OTP matching the UI screen
  FOUR_DIGIT_OTP: /^\d{4}$/,

  // Standard email validation regex
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};
