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
      subtitlesLanguage: { type: String, enum: ['Hindi', 'English', 'Off'], default: 'Hindi' },
      playbackSpeed: { type: String, enum: ['0.75x', '1x', '1.25x', '1.5x'], default: '1x' },
      appLanguage: { type: String, default: 'English' },
      notifications: {
        newEpisodes: { type: Boolean, default: true },
        newReleases: { type: Boolean, default: true },
        recommendations: { type: Boolean, default: false }
      }
    },

    // Subscription Status
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
    hasUsedFreeTrial: {
      type: Boolean,
      default: false,
      index: true
    },

    plan: {
      type: String,
      default: 'Free Tier'
    },
    totalWatchTime: {
      type: String,
      default: '0.0 hrs'
    },
    promoCode: {
      type: String,
      trim: true,
      default: null,
      index: true
    },
    voucherCode: {
      type: String,
      trim: true,
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
        ret.id = ret._id ? ret._id.toString() : ret.id;
        const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
        const phoneLast4 = doc.phoneNumber ? String(doc.phoneNumber).slice(-4) : (ret.id ? String(ret.id).slice(-4) : '1001');
        ret.name = fullName || `User #${phoneLast4}`;
        ret.phone = `${doc.countryCode || '+91'} ${doc.phoneNumber}`.trim();
        ret.plan = doc.plan || (doc.isVip ? 'Monthly Pass' : 'Free Tier');
        ret.totalWatchTime = doc.totalWatchTime || '0.0 hrs';
        ret.promoCode = doc.promoCode || doc.voucherCode || null;
        ret.avatarUrl = doc.avatarUrl || '';
        
        if (doc.vipExpiresAt) {
          ret.vipExpiresAt = new Date(doc.vipExpiresAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        } else {
          ret.vipExpiresAt = '—';
        }

        if (doc.createdAt) {
          ret.joinedAt = new Date(doc.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }

        // Relative last active
        if (doc.lastLoginAt) {
          const diffMs = Date.now() - new Date(doc.lastLoginAt).getTime();
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins < 5) ret.lastActive = 'Just now';
          else if (diffMins < 60) ret.lastActive = `${diffMins} min ago`;
          else if (diffMins < 1440) ret.lastActive = `${Math.floor(diffMins / 60)} hours ago`;
          else ret.lastActive = `${Math.floor(diffMins / 1440)} days ago`;
        } else {
          ret.lastActive = 'Recently';
        }

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
