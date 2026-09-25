import mongoose from 'mongoose';

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 1
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 1
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1
    },
    durationMonths: {
      type: Number,
      default: 1
    },
    badge: {
      type: String,
      default: null,
      trim: true
    },
    savingsText: {
      type: String,
      default: null,
      trim: true
    },
    features: {
      type: [String],
      default: [
        'Unlock all paywalled episodes (Episode 4+)',
        '1080p Full HD vertical streaming',
        'Ad-free uninterrupted viewing'
      ]
    },

    // 7-Day Free Trial parameters
    trialEligible: {
      type: Boolean,
      default: true
    },
    trialFee: {
      type: Number,
      default: 2 // Rs. 2 Token Mandate
    },
    trialDays: {
      type: Number,
      default: 7 // 7 Days
    },

    // Razorpay Integration
    razorpayPlanId: {
      type: String,
      default: null,
      trim: true
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'DRAFT', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
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

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

/**
 * Seed default plans if collection is empty
 */
export const seedDefaultSubscriptionPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    if (count > 0) return;

    const defaultPlans = [
      {
        code: 'PLAN_1M',
        name: '1 Month Pass',
        price: 99,
        originalPrice: 199,
        durationDays: 30,
        durationMonths: 1,
        badge: 'Popular',
        savingsText: 'Save Rs. 100 vs standard',
        features: [
          'Unlock all paywalled episodes (Episode 4+)',
          '1080p Full HD vertical streaming',
          'Ad-free uninterrupted viewing',
          'Hindi & English subtitles'
        ],
        trialEligible: true,
        trialFee: 2,
        trialDays: 7,
        status: 'ACTIVE',
        sortOrder: 1
      },
      {
        code: 'PLAN_6M',
        name: '6 Month Pass',
        price: 499,
        originalPrice: 594,
        durationDays: 180,
        durationMonths: 6,
        badge: 'Save 16%',
        savingsText: 'Save Rs. 95 vs monthly renewal',
        features: [
          'Unlock all paywalled episodes (Episode 4+)',
          '1080p Full HD vertical streaming',
          'Ad-free uninterrupted viewing',
          'Hindi & English subtitles',
          'Early access to weekly premiere drops'
        ],
        trialEligible: false,
        status: 'ACTIVE',
        sortOrder: 2
      },
      {
        code: 'PLAN_12M',
        name: '12 Month Annual Pass',
        price: 899,
        originalPrice: 1188,
        durationDays: 365,
        durationMonths: 12,
        badge: 'Best Value',
        savingsText: 'Save Rs. 289 vs base rate (24% OFF)',
        features: [
          'Unlock all paywalled episodes (Episode 4+)',
          '1080p Full HD vertical streaming',
          'Ad-free uninterrupted viewing',
          'Hindi & English subtitles',
          'Early access to weekly premiere drops',
          'Subscriber exclusive badge on profile'
        ],
        trialEligible: false,
        status: 'ACTIVE',
        sortOrder: 3
      }
    ];

    await SubscriptionPlan.insertMany(defaultPlans);
    console.log('[Seed] Default subscription plans created successfully.');
  } catch (err) {
    console.error('[Seed] Error seeding default subscription plans:', err);
  }
};
