import mongoose from 'mongoose';

const AutoNotificationTriggerSchema = new mongoose.Schema(
  {
    triggerKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: ['USER', 'BILLING', 'CONTENT', 'ENGAGEMENT'],
      default: 'USER',
      index: true
    },
    triggerEvent: {
      type: String,
      enum: [
        'USER_REGISTERED',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'RENEWAL_REMINDER',
        'CONTENT_RELEASE',
        'INACTIVE_WINBACK',
        'CUSTOM'
      ],
      default: 'CUSTOM'
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    targetAudience: {
      type: String,
      enum: ['All Users', 'New Users', 'Subscribers Only', 'Expiring Users', 'Inactive 7+ Days'],
      default: 'All Users'
    },
    deepLink: {
      type: String,
      default: '/home',
      trim: true
    },
    imageUrl: {
      type: String,
      default: ''
    },
    delayMinutes: {
      type: Number,
      default: 0 // 0 = immediate real-time trigger
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true
    },
    isSystem: {
      type: Boolean,
      default: false // System default triggers cannot be deleted, only toggled/edited
    },
    totalTriggeredCount: {
      type: Number,
      default: 0
    },
    lastTriggeredAt: {
      type: Date,
      default: null
    },
    lastDeliveredCount: {
      type: Number,
      default: 0
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

export const AutoNotificationTrigger = mongoose.model(
  'AutoNotificationTrigger',
  AutoNotificationTriggerSchema
);
