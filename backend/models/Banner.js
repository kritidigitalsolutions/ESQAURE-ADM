import mongoose from 'mongoose';

/**
 * Banner Model for Home Page Content Banners & Hero Carousel
 */
const BannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: '',
      trim: true
    },
    bannerUrl: {
      type: String,
      required: true,
      trim: true // 16:9 Landscape Banner Image
    },
    posterUrl: {
      type: String,
      default: '',
      trim: true // 9:16 Portrait Poster Fallback
    },
    trailerUrl: {
      type: String,
      default: '',
      trim: true // Video preview URL
    },
    badge: {
      type: String,
      default: 'FEATURED',
      trim: true // "FEATURED", "TOP 10", "TRENDING", "NEW RELEASE", "EXCLUSIVE"
    },
    linkType: {
      type: String,
      enum: ['DRAMA', 'EPISODE', 'SUBSCRIPTION', 'EXTERNAL_URL'],
      default: 'DRAMA'
    },
    dramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      default: null,
      index: true
    },
    episodeNumber: {
      type: Number,
      default: 1
    },
    externalUrl: {
      type: String,
      default: '',
      trim: true
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
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

BannerSchema.index({ isActive: 1, displayOrder: 1 });

export const Banner = mongoose.model('Banner', BannerSchema);
