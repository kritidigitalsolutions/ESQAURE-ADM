import mongoose from 'mongoose';

const EpisodeSchema = new mongoose.Schema(
  {
    dramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      required: true,
      index: true
    },
    seasonNumber: {
      type: Number,
      default: 1
    },
    episodeNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    synopsis: {
      type: String,
      default: '',
      trim: true
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true
    },

    // Bunny CDN or Direct Stream URL
    videoStreamUrl: {
      type: String,
      required: true,
      trim: true // Bunny CDN HLS playlist.m3u8 or MP4
    },
    bunnyVideoId: {
      type: String,
      default: '',
      trim: true
    },
    durationSeconds: {
      type: Number,
      required: true, // e.g., 135 for 2:15
      min: 0
    },
    formattedDuration: {
      type: String,
      default: '0:00' // e.g. "2:15"
    },

    // Monetization Gate
    isFree: {
      type: Boolean,
      default: false,
      index: true // True for Ep 1-3 teaser, False for Ep 4+ (subscription required)
    },
    viewsCount: {
      type: Number,
      default: 0
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

// Unique index per drama, season and episode number
EpisodeSchema.index({ dramaId: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });

// Virtual for formatted Season / Episode badge (e.g., "S1 · E02")
EpisodeSchema.virtual('seasonEpisodeTag').get(function () {
  const s = String(this.seasonNumber || 1);
  const ep = String(this.episodeNumber || 1).padStart(2, '0');
  return `S${s} · E${ep}`;
});

export const Episode = mongoose.model('Episode', EpisodeSchema);
