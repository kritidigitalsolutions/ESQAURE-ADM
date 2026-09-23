import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    countryCode: {
      type: String,
      default: '+91',
      trim: true
    },
    firstName: {
      type: String,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows null/empty values for new users prior to profile completion
      index: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },

    // Tracks if user has completed the "Welcome to Entertainment Squared" screen (Screen 3)
    isProfileCompleted: {
      type: Boolean,
      default: false,
      index: true
    },

    // Onboarding & Preferences
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre'
      }
    ],
    preferredContentLanguages: {
      type: [String],
      default: ['Hindi', 'English'],
      enum: ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']
    },

    // Playback & Notification Settings
    settings: {
      autoplayNext: { type: Boolean, default: true },
      videoQuality: { type: String, enum: ['Auto', '1080p', '720p'], default: 'Auto' },
      appLanguage: { type: String, default: 'English' },
      notifications: {
        newEpisodes: { type: Boolean, default: true },
        newReleases: { type: Boolean, default: true },
        recommendations: { type: Boolean, default: false }
      }
    },

    // VIP & Subscription Status
    isVip: {
      type: Boolean,
      default: false,
      index: true
    },
    vipExpiresAt: {
      type: Date,
      default: null
    },
    currentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    },

    // System & Status
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
      default: 'ACTIVE',
      index: true
    },
    fcmTokens: [
      {
        type: String
      }
    ],
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

export const User = mongoose.model('User', UserSchema);
