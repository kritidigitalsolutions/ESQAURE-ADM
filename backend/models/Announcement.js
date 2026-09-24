import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    category: {
      type: String,
      enum: ['SYSTEM', 'OFFER', 'BILLING'],
      default: 'SYSTEM'
    },
    target: {
      type: String,
      enum: ['All Active Users', 'Subscribers Only', 'New Users (Last 7 Days)'],
      default: 'All Active Users'
    },
    priority: {
      type: String,
      enum: ['Normal', 'High'],
      default: 'Normal'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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

AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ isActive: 1 });

export const Announcement = mongoose.model('Announcement', AnnouncementSchema);
