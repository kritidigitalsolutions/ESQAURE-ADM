import mongoose from 'mongoose';

const HomeSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: '',
      trim: true
    },
    sectionType: {
      type: String,
      enum: ['GENRE', 'CUSTOM_CURATED', 'NEW_RELEASES', 'TRENDING', 'PRIORITY_CONTENT'],
      default: 'GENRE',
      index: true
    },
    // Associated Genre (used when sectionType === 'GENRE')
    genreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
      default: null
    },
    // Manually curated list of dramas (used when sectionType === 'CUSTOM_CURATED')
    dramaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Drama'
      }
    ],
    // Display layout template on mobile frontend
    layout: {
      type: String,
      enum: ['HORIZONTAL_CARD', 'PORTRAIT_GRID', 'HERO_CAROUSEL', 'FEATURED_BANNER'],
      default: 'HORIZONTAL_CARD'
    },
    // Priority order set by Admin (1 is displayed first, then 2, 3...)
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    // Maximum items to display in the home tray
    maxItems: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    },
    viewAllEnabled: {
      type: Boolean,
      default: true
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

export const HomeSection = mongoose.model('HomeSection', HomeSectionSchema);
