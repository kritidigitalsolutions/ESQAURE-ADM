import mongoose from 'mongoose';

const AccountDeletionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: {
      type: String,
      trim: true,
      default: ''
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    countryCode: {
      type: String,
      default: '+91',
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    reason: {
      type: String,
      trim: true,
      default: 'User requested account deletion via profile'
    },
    feedback: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    scheduledDeletionAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24-hour SLA
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminNotes: {
      type: String,
      trim: true,
      default: ''
    },
    userSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

AccountDeletionRequestSchema.index({ status: 1, requestedAt: -1 });

export const AccountDeletionRequest = mongoose.model(
  'AccountDeletionRequest',
  AccountDeletionRequestSchema
);
