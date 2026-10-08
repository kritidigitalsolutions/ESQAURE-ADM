import mongoose from 'mongoose';

const CustomAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    advertiser: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['BANNER', 'INTERSTITIAL', 'VIDEO_PREROLL', 'NATIVE_CARD'],
      required: true
    },
    placement: {
      type: String,
      enum: [
        'ALL_PLACEMENTS',
        'HOME_BANNER',
        'PLAYER_PREROLL',
        'EPISODE_TRANSITION',
        'DRAWER_CARD',
        'GLOBAL_POPUP'
      ],
      default: 'ALL_PLACEMENTS'
    },
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE'
    },
    mediaUrl: {
      type: String,
      required: true
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    videoDuration: {
      type: Number,
      default: 15 // seconds
    },
    skipAfterSeconds: {
      type: Number,
      default: 5 // seconds before skip button appears; 0 = unskippable
    },
    ctaText: {
      type: String,
      default: 'Learn More'
    },
    ctaAction: {
      type: String,
      enum: ['EXTERNAL_URL', 'DEEP_LINK_DRAMA', 'DEEP_LINK_SUBSCRIPTION', 'IN_APP_BROWSER'],
      default: 'EXTERNAL_URL'
    },
    targetUrl: {
      type: String,
      default: ''
    },
    targetDramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED'],
      default: 'ACTIVE'
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    targetGenres: [
      {
        type: String
      }
    ],
    impressionsCount: {
      type: Number,
      default: 0
    },
    clicksCount: {
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

// Virtual for Click-Through-Rate (CTR)
CustomAdSchema.virtual('ctr').get(function () {
  if (!this.impressionsCount || this.impressionsCount === 0) return '0.00%';
  const rate = (this.clicksCount / this.impressionsCount) * 100;
  return `${rate.toFixed(2)}%`;
});

export const CustomAd = mongoose.model('CustomAd', CustomAdSchema);
