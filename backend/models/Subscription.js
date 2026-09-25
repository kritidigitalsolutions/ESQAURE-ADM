import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    /**
     * 4 Crisp Lifecycle States (Zero Grace Period):
     * - TRIAL: User active in 7-Day Rs. 2 trial
     * - ACTIVE: Fully paid and active subscription pass
     * - CANCELLED: Mandate revoked via GPay/PhonePe; access continues until currentPeriodEnd
     * - EXPIRED: Terminated / locked immediately upon payment failure or period end
     */
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },

    // 7-Day Free Trial Parameters
    isTrial: {
      type: Boolean,
      default: false,
      index: true
    },
    trialEndsAt: {
      type: Date,
      default: null
    },

    // Billing Cycle Dates
    startDate: {
      type: Date,
      default: Date.now
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
      index: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    },

    // Scheduled Plan Change (e.g. Downgrades take effect at end of period)
    scheduledPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      default: null
    },

    // Razorpay Integration & UPI AutoPay Mandate
    paymentGateway: {
      type: String,
      enum: ['RAZORPAY'],
      default: 'RAZORPAY'
    },
    razorpaySubscriptionId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    razorpayCustomerId: {
      type: String,
      default: null,
      trim: true
    },
    mandateId: {
      type: String,
      default: null,
      trim: true
    },

    // External Revocation (via Google Pay, PhonePe, Paytm, etc.)
    cancelledAt: {
      type: Date,
      default: null
    },
    cancellationSource: {
      type: String,
      enum: ['UPI_APP_REVOKE', 'GATEWAY_CANCEL', 'ADMIN', 'SYSTEM'],
      default: null
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

// Virtual helper to check if subscription is actively usable for premium playback
SubscriptionSchema.virtual('isValid').get(function () {
  const now = new Date();
  if (this.status === 'EXPIRED') return false;
  if (this.status === 'ACTIVE' || this.status === 'TRIAL' || this.status === 'CANCELLED') {
    return this.currentPeriodEnd > now;
  }
  return false;
});

export const Subscription = mongoose.model('Subscription', SubscriptionSchema);
