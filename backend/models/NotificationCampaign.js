import mongoose from 'mongoose';

const NotificationCampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    targetAudience: {
      type: String,
      enum: ['All Users', 'Subscribers Only', 'Inactive 7+ Days', 'Specific User'],
      default: 'All Users'
    },
    targetUserId: {
      type: String,
      default: ''
    },
    targetUserName: {
      type: String,
      default: ''
    },
    selectedDrama: {
      type: String,
      default: ''
    },
    deepLink: {
      type: String,
      default: ''
    },
    sentCount: {
      type: Number,
      default: 0
    },
    deliveredCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    openRate: {
      type: String,
      default: '0.0%'
    },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'FAILED', 'SCHEDULED'],
      default: 'SENT'
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

NotificationCampaignSchema.index({ createdAt: -1 });

export const NotificationCampaign = mongoose.model(
  'NotificationCampaign',
  NotificationCampaignSchema
);
