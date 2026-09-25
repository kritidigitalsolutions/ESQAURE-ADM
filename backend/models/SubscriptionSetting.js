import mongoose from 'mongoose';

const SubscriptionSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true
    },
    // 7-Day Free Trial AutoPay Mandate Configuration
    trialEnabled: {
      type: Boolean,
      default: true
    },
    trialFee: {
      type: Number,
      default: 2,
      min: 1
    },
    trialDurationDays: {
      type: Number,
      default: 7,
      min: 1
    },
    termsText: {
      type: String,
      default:
        'Enjoy a 7-day free trial for just Rs. 2. The Rs. 2 trial payment is non-refundable. After the 7-day trial period ends, your subscription will automatically renew as a paid subscription through the enabled AutoPay option. The applicable subscription fee will be charged automatically unless you cancel via your UPI app (Google Pay / PhonePe) before the trial period ends.'
    },
    conversionRate: {
      type: String,
      default: '14.8%'
    },
    autoPayMandate: {
      type: Boolean,
      default: true
    },
    refundable: {
      type: Boolean,
      default: false
    },
    gateway: {
      type: String,
      default: 'Razorpay UPI e-Mandate'
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

export const SubscriptionSetting = mongoose.model('SubscriptionSetting', SubscriptionSettingSchema);

/**
 * Ensures global default subscription settings exist in the database
 */
export async function getOrCreateSubscriptionSettings() {
  let settings = await SubscriptionSetting.findOne({ key: 'global' });
  if (!settings) {
    settings = await SubscriptionSetting.create({ key: 'global' });
  }
  return settings;
}
