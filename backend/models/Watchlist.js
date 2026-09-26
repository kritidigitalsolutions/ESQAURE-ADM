import mongoose from 'mongoose';

/**
 * Watchlist (Saved Series / Watch Later) Model
 * Represents a drama bookmarked/saved by an authenticated user.
 * As defined in Architecture.md Section 3.6:
 * userId + dramaId compound unique index ensures a drama is saved at most once per user.
 */
const WatchlistSchema = new mongoose.Schema(
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
    addedAt: {
      type: Date,
      default: Date.now,
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

// Unique compound index: a user can only have one active watchlist entry per drama
WatchlistSchema.index({ userId: 1, dramaId: 1 }, { unique: true });

// Compound index for sorted pagination of user's saved series
WatchlistSchema.index({ userId: 1, addedAt: -1 });

export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
