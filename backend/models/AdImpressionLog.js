import mongoose from 'mongoose';

const AdImpressionLogSchema = new mongoose.Schema(
  {
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomAd',
      required: true,
      index: true
    },
    advertiser: {
      type: String,
      default: ''
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    viewerKey: {
      type: String, // 'user:<id>' or 'anon:<sha256>'
      required: true,
      index: true
    },
    ipHash: {
      type: String,
      default: ''
    },
    deviceId: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'ALL_PLACEMENTS'
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true
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

// Compound index for burst / rapid spam debounce (within 5 seconds)
AdImpressionLogSchema.index({ adId: 1, viewerKey: 1, createdAt: -1 });

// Compound index for user frequency capping calculation (today's impressions by viewer)
AdImpressionLogSchema.index({ adId: 1, viewerKey: 1, date: 1 });

export const AdImpressionLog = mongoose.model('AdImpressionLog', AdImpressionLogSchema);
