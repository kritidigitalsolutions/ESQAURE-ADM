import mongoose from 'mongoose';

const PlaybackViewSchema = new mongoose.Schema(
  {
    dramaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drama',
      required: true,
      index: true
    },
    episodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Episode',
      required: true,
      index: true
    },
    episodeNumber: {
      type: Number,
      required: true,
      index: true
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
    platform: {
      type: String,
      enum: ['android', 'ios', 'web', 'unknown'],
      default: 'unknown'
    },
    watchedSeconds: {
      type: Number,
      default: 0
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

// Compound index for ultra-fast session cooldown checks: (viewerKey + episodeId + createdAt)
PlaybackViewSchema.index({ viewerKey: 1, episodeId: 1, createdAt: -1 });

// Compound index for timeseries daily analytics per drama / episode
PlaybackViewSchema.index({ dramaId: 1, date: 1 });
PlaybackViewSchema.index({ episodeId: 1, date: 1 });

export const PlaybackView = mongoose.model('PlaybackView', PlaybackViewSchema);
