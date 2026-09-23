import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true
    },
    countryCode: {
      type: String,
      default: '+91'
    },
    otp: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    lastRequestedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Document auto-deletes when expiresAt timestamp is reached
    }
  },
  {
    timestamps: true
  }
);

export const Otp = mongoose.model('Otp', OtpSchema);
