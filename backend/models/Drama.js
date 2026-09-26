import mongoose from 'mongoose';

const DramaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    synopsis: {
      type: String,
      default: '',
      trim: true
    },

    // Media Assets
    posterUrl: {
      type: String,
      required: true,
      trim: true // 9:16 vertical poster
    },
    bannerUrl: {
      type: String,
      default: '',
      trim: true // 16:9 carousel banner
    },
    trailerUrl: {
      type: String,
      default: '',
      trim: true // 9:16 vertical preview clip
    },

    // Categorization
    genres: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        index: true
      }
    ],
    languages: {
      type: [String],
      default: ['Hindi']
    },
    ageRating: {
      type: String,
      default: 'U/A 13+'
    },
    director: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },

    // Metadata & Statistics
    releaseDate: {
      type: Date,
      default: Date.now
    },
    totalEpisodes: {
      type: Number,
      default: 0
    },
    viewsCount: {
      type: Number,
      default: 0,
      index: true
    },
    rating: {
      type: Number,
      default: 4.8
    },

    // Curation Flags
    isTrending: {
      type: Boolean,
      default: false,
      index: true
    },
    trendingRank: {
      type: Number,
      default: null
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isNewRelease: {
      type: Boolean,
      default: true,
      index: true
    },
    // Priority / Display Order set by Admin (lower number = higher priority e.g. 1, 2, 3...)
    priority: {
      type: Number,
      default: 0,
      index: true
    },

    // Paywall & Plan Tier
    isPaid: {
      type: Boolean,
      default: true,
      index: true
    },
    plan: {
      type: String,
      default: 'Premium Plan'
    },
    freeEpisodes: {
      type: Number,
      default: 3
    },

    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
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

// Virtual for formatted genre string (e.g. "Romance / Drama")
DramaSchema.virtual('genreDisplay').get(function () {
  if (Array.isArray(this.genres) && this.genres.length > 0) {
    return this.genres
      .map((g) => (typeof g === 'object' && g.name ? g.name : g))
      .filter(Boolean)
      .join(' / ');
  }
  return '';
});

export const Drama = mongoose.model('Drama', DramaSchema);
