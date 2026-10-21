const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      uppercase: true,
      trim: true,
      maxlength: [30, 'Discount code cannot exceed 30 characters'],
    },
    type: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
      default: 'PERCENT',
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount value must be at least 1'],
    },
    minOrderPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountPaise: {
      type: Number,
      default: 0, // 0 means no maximum cap
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

discountSchema.index({ storeId: 1, code: 1 }, { unique: true });
discountSchema.index({ storeId: 1, isActive: 1 });

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
