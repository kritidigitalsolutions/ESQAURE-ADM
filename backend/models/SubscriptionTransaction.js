import mongoose from 'mongoose';

const SubscriptionTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null,
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },

    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true
    },

    type: {
      type: String,
      enum: ['TRIAL_TOKEN', 'NEW_PURCHASE', 'UPGRADE', 'AUTOPAY_RENEWAL', 'REFUND'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },

    // Razorpay identifiers
    gatewayPaymentId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    gatewayOrderId: {
      type: String,
      default: null,
      trim: true,
      index: true
    },
    gatewaySignature: {
      type: String,
      default: null
    },

    failureReason: {
      type: String,
      default: null
    },
    rawWebhookEvent: {
      type: mongoose.Schema.Types.Mixed,
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

export const SubscriptionTransaction = mongoose.model('SubscriptionTransaction', SubscriptionTransactionSchema);
