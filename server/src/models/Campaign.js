const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
      default: '',
    },
    badge: {
      type: String,
      trim: true,
      maxlength: [40, 'Badge text cannot exceed 40 characters'],
      default: 'Special Deal',
    },
    category: {
      type: String,
      trim: true,
      default: 'All',
    },
    dealType: {
      type: String,
      enum: ['PERCENTAGE_DISCOUNT', 'PRICE_CAP', 'FLAT_DISCOUNT', 'SPECIAL_COLLECTION'],
      default: 'PERCENTAGE_DISCOUNT',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative'],
      max: [90, 'Discount value cannot exceed 90%'],
    },
    priceCapPaise: {
      type: Number,
      default: 0,
      min: [0, 'Price cap cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Campaign start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Campaign end date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    bgGradient: {
      type: String,
      default: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    },
    textColor: {
      type: String,
      default: '#be123c',
    },
  },
  {
    timestamps: true,
  }
);

// Method to determine current schedule status based on real-time timestamps
campaignSchema.methods.getStatus = function () {
  const now = new Date();
  if (now < this.startDate) {
    return 'UPCOMING';
  }
  if (now > this.endDate) {
    return 'EXPIRED';
  }
  return this.isActive ? 'ACTIVE' : 'PAUSED';
};

// Compound index for fast tenant and schedule lookups
campaignSchema.index({ storeId: 1, isActive: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ storeId: 1, createdAt: -1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
