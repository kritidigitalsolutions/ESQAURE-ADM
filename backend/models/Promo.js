import mongoose from 'mongoose';

const PromoSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT', 'FREE_DAYS'],
      required: true,
      default: 'PERCENTAGE'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    // "ALL" means applicable to all plans, otherwise store planId reference
    applicablePlan: {
      type: String,
      default: 'ALL',
      trim: true
    },
    maxUses: {
      type: Number,
      required: true,
      min: 1,
      default: 1000
    },
    currentUses: {
      type: Number,
      default: 0,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    description: {
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

// Auto-expire promos past their expiry date
PromoSchema.pre('find', function () {
  this.where({ $or: [{ expiryDate: { $gt: new Date() } }, { status: 'EXPIRED' }] });
});

// Virtual: computed status based on expiry
PromoSchema.virtual('computedStatus').get(function () {
  if (this.expiryDate < new Date()) return 'EXPIRED';
  if (this.currentUses >= this.maxUses) return 'EXHAUSTED';
  return this.status;
});

export const Promo = mongoose.model('Promo', PromoSchema);
