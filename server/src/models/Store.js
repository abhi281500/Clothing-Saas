const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
      default: 'Curated Boutique Fashion',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    whatsappNumber: {
      type: String,
      trim: true,
      match: [/^[0-9+]{10,15}$/, 'Please enter a valid phone/WhatsApp number'],
    },
    instagramHandle: {
      type: String,
      trim: true,
    },
    branding: {
      logoUrl: { type: String, default: '' },
      bannerUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#e11d48' }, // Indian rose/pink default
      accentColor: { type: String, default: '#f43f5e' },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
storeSchema.index({ slug: 1 }, { unique: true });
storeSchema.index({ ownerId: 1 });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
