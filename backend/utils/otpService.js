import crypto from 'crypto';
import { Otp } from '../models/Otp.js';
import { env } from '../config/env.js';
import { AppError } from './appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class OtpService {
  /**
   * Format full international phone number
   * @param {string} phoneNumber
   * @param {string} countryCode
   * @returns {string} e.g. "+919876543210"
   */
  static formatFullNumber(phoneNumber, countryCode = '+91') {
    const cleanCountry = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return `${cleanCountry}${cleanPhone}`;
  }

  /**
   * Format masked phone number matching the mobile UI
   * Example: "+91 76••••97"
   * @param {string} phoneNumber
   * @param {string} countryCode
   * @returns {string}
   */
  static maskPhoneNumber(phoneNumber, countryCode = '+91') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanCountry = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;

    if (cleanPhone.length >= 4) {
      const first2 = cleanPhone.slice(0, 2);
      const last2 = cleanPhone.slice(-2);
      return `${cleanCountry} ${first2}••••${last2}`;
    }

    return `${cleanCountry} ••••`;
  }

  /**
   * Generate a random cryptographically secure 4-digit numeric OTP (1000 - 9999)
   * Always generated randomly every single time
   * @returns {string}
   */
  static generateCode() {
    return crypto.randomInt(1000, 10000).toString();
  }

  /**
   * Request and store a 4-digit OTP for a phone number using MongoDB with TTL
   * @param {string} phoneNumber
   * @param {string} countryCode
   * @returns {Promise<{ otp: string, maskedNumber: string, formattedNumber: string, resendAfterSeconds: number, expiresInSeconds: number }>}
   */
  static async requestOtp(phoneNumber, countryCode = '+91') {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedNumber = this.formatFullNumber(cleanPhone, countryCode);

    // 1. Check cooldown (60 seconds)
    const existingOtp = await Otp.findOne({
      phoneNumber: cleanPhone,
      countryCode
    });

    if (existingOtp && existingOtp.lastRequestedAt) {
      const elapsedSeconds = (Date.now() - new Date(existingOtp.lastRequestedAt).getTime()) / 1000;
      if (elapsedSeconds < env.OTP_COOLDOWN_SECONDS) {
        const remainingSeconds = Math.ceil(env.OTP_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(
          `Please wait ${remainingSeconds}s before requesting a new OTP. Try again shortly.`,
          429,
          ERROR_CODES.OTP_COOLDOWN_ACTIVE,
          { retryAfterSeconds: remainingSeconds }
        );
      }
    }

    // 2. Generate random 4-digit OTP
    const otp = this.generateCode();
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

    // 3. Upsert OTP record in MongoDB (auto-expires via TTL index)
    await Otp.findOneAndUpdate(
      { phoneNumber: cleanPhone, countryCode },
      {
        otp,
        attempts: 0,
        isUsed: false,
        lastRequestedAt: new Date(),
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const maskedNumber = this.maskPhoneNumber(cleanPhone, countryCode);

    console.log(`[OTP Dispatcher] Sent 4-digit OTP [${otp}] to ${maskedNumber} (${formattedNumber})`);

    return {
      otp,
      maskedNumber,
      formattedNumber,
      resendAfterSeconds: env.OTP_COOLDOWN_SECONDS,
      expiresInSeconds: env.OTP_EXPIRY_SECONDS
    };
  }

  /**
   * Verify provided 4-digit OTP using MongoDB
   * @param {string} phoneNumber
   * @param {string} countryCode
   * @param {string} enteredOtp
   * @returns {Promise<boolean>}
   */
  static async verifyOtp(phoneNumber, countryCode = '+91', enteredOtp) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const otpRecord = await Otp.findOne({
      phoneNumber: cleanPhone,
      countryCode
    });

    if (!otpRecord || otpRecord.isUsed) {
      throw new AppError(
        'OTP has expired or was not requested. Please request a new code.',
        400,
        ERROR_CODES.OTP_EXPIRED
      );
    }

    // Check expiration timestamp
    if (Date.now() > new Date(otpRecord.expiresAt).getTime()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new AppError(
        'OTP has expired. Please request a new code.',
        400,
        ERROR_CODES.OTP_EXPIRED
      );
    }

    // Check maximum attempts (max 5)
    if (otpRecord.attempts >= env.MAX_OTP_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new AppError(
        'Maximum verification attempts exceeded. Please request a new OTP.',
        400,
        ERROR_CODES.OTP_MAX_ATTEMPTS_EXCEEDED
      );
    }

    // Verify OTP match against the randomly generated code
    if (enteredOtp !== otpRecord.otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remainingAttempts = env.MAX_OTP_ATTEMPTS - otpRecord.attempts;

      throw new AppError(
        `Invalid OTP entered. ${remainingAttempts} attempts remaining.`,
        400,
        ERROR_CODES.OTP_INVALID,
        { remainingAttempts }
      );
    }

    // Successful verification -> delete OTP record to prevent replay
    await Otp.deleteOne({ _id: otpRecord._id });

    return true;
  }
}
