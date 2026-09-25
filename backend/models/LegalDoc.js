import mongoose from 'mongoose';

const LegalDocSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Document slug identifier is required'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Document content is required'],
      default: ''
    },
    summary: {
      type: String,
      trim: true,
      default: ''
    },
    version: {
      type: String,
      trim: true,
      default: '1.0.0'
    },
    effectiveDate: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    updatedBy: {
      type: String,
      trim: true,
      default: 'System Admin'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Normalizes input slugs and common abbreviations / mobile query keys to canonical slugs
 * @param {string} rawSlug
 * @returns {string}
 */
LegalDocSchema.statics.normalizeSlug = function (rawSlug) {
  if (!rawSlug) return '';
  const cleaned = String(rawSlug).trim().toLowerCase();
  const aliasMap = {
    privacy: 'privacy-policy',
    'privacy-policy': 'privacy-policy',
    privacypolicy: 'privacy-policy',
    terms: 'terms-and-conditions',
    'terms-and-conditions': 'terms-and-conditions',
    'terms-conditions': 'terms-and-conditions',
    'terms-of-service': 'terms-and-conditions',
    termsofservice: 'terms-and-conditions',
    refund: 'refund-policy',
    'refund-policy': 'refund-policy',
    refundpolicy: 'refund-policy',
    cancellation: 'refund-policy',
    'cancellation-policy': 'refund-policy',
    grievance: 'grievance-compliance',
    'grievance-compliance': 'grievance-compliance',
    compliance: 'grievance-compliance',
    ethics: 'grievance-compliance'
  };
  return aliasMap[cleaned] || cleaned;
};

export const LegalDoc = mongoose.model('LegalDoc', LegalDocSchema);
