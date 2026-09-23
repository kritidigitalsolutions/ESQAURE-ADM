import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esquare_ott',
  JWT_SECRET: process.env.JWT_SECRET || 'esquare_ott_super_secure_jwt_secret_key_2026_x!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OTP_COOLDOWN_SECONDS: parseInt(process.env.OTP_COOLDOWN_SECONDS || '60', 10),
  OTP_EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10),
  MAX_OTP_ATTEMPTS: parseInt(process.env.MAX_OTP_ATTEMPTS || '5', 10),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
};

export const isDev = env.NODE_ENV !== 'production';
