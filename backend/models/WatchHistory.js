import mongoose from 'mongoose';

const WatchedEpisodeSchema = new mongoose.Schema(
  {
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
      required: true
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
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    progressPercentage: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const WatchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      required: true,
      index: true
    },
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
      required: true
    },
    seasonNumber: {
      type: Number,
      default: 1
    },
    episodeNumber: {
      type: Number,
      required: true
    },
    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    durationSeconds: {
      type: Number,
      required: true,
      default: 0
    },
    progressPercentage: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    totalEpisodesWatched: {
      type: Number,
      default: 1
    },
    watchedEpisodes: {
      type: [WatchedEpisodeSchema],
      default: []
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

// One active watch progress per user per drama (for "Continue Watching" row)
WatchHistorySchema.index({ userId: 1, dramaId: 1 }, { unique: true });
WatchHistorySchema.index({ userId: 1, lastWatchedAt: -1 });
WatchHistorySchema.index({ userId: 1, isCompleted: 1 });

export const WatchHistory = mongoose.model('WatchHistory', WatchHistorySchema);
