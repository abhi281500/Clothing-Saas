const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true, // e.g., 'XS', 'S', 'M', 'L', 'XL', 'Free Size'
    },
    color: {
      type: String,
      required: true,
      trim: true, // e.g., 'Maroon', 'Emerald Green', 'Mustard'
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    priceDifferencePaise: {
      type: Number,
      default: 0, // In paise (0 means same as base price)
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'Clothing', // e.g., 'Kurtis', 'Sarees', 'Co-ord Sets', 'Lehengas', 'Western Wear'
    },
    basePricePaise: {
      type: Number,
      required: [true, 'Base price in paise is required'],
      min: [0, 'Price must be non-negative'],
    },
    compareAtPricePaise: {
      type: Number,
      min: [0, 'Compare-at price must be non-negative'],
      default: 0,
    },
    images: {
      type: [String], // Array of CDN or external image URLs
      default: [],
    },
    variants: [variantSchema],
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: auto-calculate total stock from variants if variants exist
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  }
  next();
});

// Compound Indexes for fast tenant-scoped queries
productSchema.index({ storeId: 1, slug: 1 }, { unique: true });
productSchema.index({ storeId: 1, isPublished: 1, createdAt: -1 });
productSchema.index({ storeId: 1, category: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
