import mongoose from 'mongoose';

const DailyStatSchema = new mongoose.Schema(
  {
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true
    },
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    videoStarts: {
      type: Number,
      default: 0
    },
    videoCompletes: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const CustomAdSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    advertiser: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['BANNER', 'INTERSTITIAL', 'VIDEO_PREROLL', 'NATIVE_CARD', 'SPLASH_POPUP', 'REWARDED'],
      required: true,
      index: true
    },
    placement: {
      type: String,
      enum: [
        'ALL_PLACEMENTS',
        'HOME_BANNER',
        'PLAYER_PREROLL',
        'EPISODE_TRANSITION',
        'DRAWER_CARD',
        'GLOBAL_POPUP',
        'HEADER_LEADERBOARD',
        'EPISODE_SIDEBAR',
        'FOOTER_BANNER'
      ],
      default: 'ALL_PLACEMENTS',
      index: true
    },
    mediaType: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE'
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true
    },
    companionBannerUrl: {
      type: String,
      default: '',
      trim: true
    },
    aspectRatio: {
      type: String,
      enum: ['AUTO', '16:9', '9:16', '1:1', '4:3'],
      default: 'AUTO'
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
      default: 'Learn More',
      trim: true
    },
    ctaAction: {
      type: String,
      enum: ['EXTERNAL_URL', 'DEEP_LINK_DRAMA', 'DEEP_LINK_SUBSCRIPTION', 'IN_APP_BROWSER'],
      default: 'EXTERNAL_URL'
    },
    targetUrl: {
      type: String,
      default: '',
      trim: true
    },
    targetWindow: {
      type: String,
      enum: ['_blank', '_self', 'deep_link'],
      default: '_blank'
    },
    targetDevices: {
      type: String,
      enum: ['ALL', 'ANDROID', 'IOS', 'WEB'],
      default: 'ALL',
      index: true
    },
    targetPage: {
      type: String,
      enum: ['ALL_PAGES', 'HOME_ONLY', 'WATCH_ONLY', 'VIP_PAGE'],
      default: 'ALL_PAGES',
      index: true
    },
    targetDramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      default: null
    },
    targetDramas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drama'
      }
    ],
    targetGenres: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'EXPIRED', 'SCHEDULED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    endDate: {
      type: Date,
      default: null,
      index: true
    },
    // Delivery Budget & Frequency Caps
    cappingImpressions: {
      type: Number,
      default: null
    },
    cappingClicks: {
      type: Number,
      default: null
    },
    dailyImpressionCap: {
      type: Number,
      default: null
    },
    userFrequencyCap: {
      type: Number,
      default: null
    },
    // Core Aggregate Performance Counters
    impressionsCount: {
      type: Number,
      default: 0
    },
    clicksCount: {
      type: Number,
      default: 0
    },
    // VAST Video Funnel Metrics
    videoStarts: {
      type: Number,
      default: 0
    },
    videoFirstQuartile: {
      type: Number,
      default: 0
    },
    videoMidpoint: {
      type: Number,
      default: 0
    },
    videoThirdQuartile: {
      type: Number,
      default: 0
    },
    videoCompletes: {
      type: Number,
      default: 0
    },
    skipsCount: {
      type: Number,
      default: 0
    },
    // Timeseries Daily Analytics Breakdown (last 90 days)
    dailyStats: {
      type: [DailyStatSchema],
      default: []
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

// Compound indexes for ultra-fast ad server decisioning
CustomAdSchema.index({ status: 1, placement: 1, priority: -1 });
CustomAdSchema.index({ status: 1, startDate: 1, endDate: 1 });
CustomAdSchema.index({ status: 1, targetDevices: 1, targetPage: 1 });

// Virtual for Click-Through-Rate (CTR)
CustomAdSchema.virtual('ctr').get(function () {
  if (!this.impressionsCount || this.impressionsCount === 0) return '0.00%';
  const rate = (this.clicksCount / this.impressionsCount) * 100;
  return `${rate.toFixed(2)}%`;
});

// Virtual for Video Completion Rate (VCR)
CustomAdSchema.virtual('completionRate').get(function () {
  if (!this.videoStarts || this.videoStarts === 0) return '0.00%';
  const rate = (this.videoCompletes / this.videoStarts) * 100;
  return `${rate.toFixed(2)}%`;
});

// Virtual to determine if capping limits have been reached
CustomAdSchema.virtual('isCapReached').get(function () {
  if (this.cappingImpressions && this.impressionsCount >= this.cappingImpressions) {
    return true;
  }
  if (this.cappingClicks && this.clicksCount >= this.cappingClicks) {
    return true;
  }
  return false;
});

export const CustomAd = mongoose.model('CustomAd', CustomAdSchema);
