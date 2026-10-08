import mongoose from 'mongoose';

const AdSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true
    },
    // Master System Toggles
    globalAdsEnabled: {
      type: Boolean,
      default: true
    },
    customAdsEnabled: {
      type: Boolean,
      default: true
    },
    admobEnabled: {
      type: Boolean,
      default: true
    },
    testMode: {
      type: Boolean,
      default: false
    },
    androidAppId: {
      type: String,
      default: 'ca-app-pub-9920192847192847~1234567890'
    },
    iosAppId: {
      type: String,
      default: 'ca-app-pub-9920192847192847~0987654321'
    },
    // AdMob Ad Units per format
    adUnits: {
      rewarded: {
        android: { type: String, default: 'ca-app-pub-9920192847192847/1122334455' },
        ios: { type: String, default: 'ca-app-pub-9920192847192847/5544332211' },
        enabled: { type: Boolean, default: true },
        rewardDescription: { type: String, default: 'Unlock Episode / 1 Free Pass' }
      },
      interstitial: {
        android: { type: String, default: 'ca-app-pub-9920192847192847/2233445566' },
        ios: { type: String, default: 'ca-app-pub-9920192847192847/6655443322' },
        enabled: { type: Boolean, default: true },
        intervalEpisodes: { type: Number, default: 3 }
      },
      banner: {
        android: { type: String, default: 'ca-app-pub-9920192847192847/3344556677' },
        ios: { type: String, default: 'ca-app-pub-9920192847192847/7766554433' },
        enabled: { type: Boolean, default: true }
      },
      appOpen: {
        android: { type: String, default: 'ca-app-pub-9920192847192847/4455667788' },
        ios: { type: String, default: 'ca-app-pub-9920192847192847/8877665544' },
        enabled: { type: Boolean, default: false }
      },
      native: {
        android: { type: String, default: 'ca-app-pub-9920192847192847/5566778899' },
        ios: { type: String, default: 'ca-app-pub-9920192847192847/9988776655' },
        enabled: { type: Boolean, default: true }
      }
    },
    // Overall Mediation & Delivery Strategy
    mediationMode: {
      type: String,
      enum: ['CUSTOM_FIRST', 'ADMOB_FIRST', 'PERCENTAGE_SPLIT', 'CUSTOM_ONLY', 'ADMOB_ONLY'],
      default: 'CUSTOM_FIRST'
    },
    customAdSharePercent: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    // Synchronized Granular Placement Controls
    placementControls: {
      playerPreroll: {
        mode: {
          type: String,
          enum: ['BOTH_CUSTOM_FIRST', 'CUSTOM_ONLY', 'ADMOB_ONLY', 'DISABLED'],
          default: 'BOTH_CUSTOM_FIRST'
        },
        enabled: { type: Boolean, default: true }
      },
      episodeTransition: {
        mode: {
          type: String,
          enum: ['BOTH_CUSTOM_FIRST', 'CUSTOM_ONLY', 'ADMOB_ONLY', 'DISABLED'],
          default: 'BOTH_CUSTOM_FIRST'
        },
        enabled: { type: Boolean, default: true }
      },
      homeBanner: {
        mode: {
          type: String,
          enum: ['BOTH_CUSTOM_FIRST', 'CUSTOM_ONLY', 'ADMOB_ONLY', 'DISABLED'],
          default: 'BOTH_CUSTOM_FIRST'
        },
        enabled: { type: Boolean, default: true }
      },
      drawerCard: {
        mode: {
          type: String,
          enum: ['BOTH_CUSTOM_FIRST', 'CUSTOM_ONLY', 'ADMOB_ONLY', 'DISABLED'],
          default: 'BOTH_CUSTOM_FIRST'
        },
        enabled: { type: Boolean, default: true }
      },
      appOpen: {
        mode: {
          type: String,
          enum: ['BOTH_CUSTOM_FIRST', 'CUSTOM_ONLY', 'ADMOB_ONLY', 'DISABLED'],
          default: 'DISABLED'
        },
        enabled: { type: Boolean, default: false }
      }
    },
    vipBypassAds: {
      type: Boolean,
      default: true // active paid subscribers bypass all ads
    },
    globalAdFrequencyCap: {
      type: Number,
      default: 6 // max interstitial/popup ads per hour per user
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

export const AdSetting = mongoose.model('AdSetting', AdSettingSchema);
