import mongoose from 'mongoose';

const VoucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    // The subscription plan this voucher grants
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'PLAN_1M'
    },
    planName: {
      type: String,
      required: true,
      trim: true,
      default: '1 Month Pass'
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      default: 30
    },
    voucherType: {
      type: String,
      enum: ['SINGLE_USE', 'MULTI_USE'],
      default: 'SINGLE_USE'
    },
    maxUses: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0
    },
    // Track users who redeemed this voucher
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String, default: '' },
        userPhone: { type: String, default: '' },
        redeemedAt: { type: Date, default: Date.now }
      }
    ],
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED', 'EXHAUSTED'],
      default: 'ACTIVE',
      index: true
    },
    campaignName: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual: computed status based on expiry
VoucherSchema.virtual('computedStatus').get(function () {
  if (this.expiryDate < new Date()) return 'EXPIRED';
  if (this.currentUses >= this.maxUses) return 'EXHAUSTED';
  return this.status;
});

export const Voucher = mongoose.model('Voucher', VoucherSchema);
