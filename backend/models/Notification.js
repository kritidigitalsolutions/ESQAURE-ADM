import mongoose from 'mongoose';

/**
 * Notification Types matching the UI screens:
 *  - NEW_EPISODE   → "New Episode Available"  (red dot, film icon)
 *  - NEW_RELEASE   → "New Release"            (red dot, film icon)
 *  - RECOMMENDATION → "Recommended For You"  (system-generated)
 *  - SYSTEM        → Generic system messages
 */
const NOTIFICATION_TYPES = ['NEW_EPISODE', 'NEW_RELEASE', 'RECOMMENDATION', 'SYSTEM'];

const NotificationSchema = new mongoose.Schema(
  {
    // Recipient — always required (per-user notification)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Type drives the icon / grouping logic on the mobile app
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true
    },

    // Short heading shown in bold on the notification card
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },

    // Subtitle / body text under the title
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    // Optional thumbnail URL (the film/image box on the right of each card)
    imageUrl: {
      type: String,
      default: null
    },

    // Deep-link: mobile app navigates here on tap (e.g. "/content/slug-123")
    deepLink: {
      type: String,
      default: null
    },

    // Optional reference to the content item this notification is about
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    // Read state — the red dot on the UI
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    // For admin-sent / broadcast notifications
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true, // createdAt used for "12 min ago", "2 days ago" grouping
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

// Compound index for efficient per-user listing + unread count
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
