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
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      default: '',
    },
    facebookUrl: {
      type: String,
      trim: true,
      default: '',
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      default: '',
    },
    branding: {
      logoUrl: { type: String, default: '' },
      bannerUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#e11d48' }, // Indian rose/pink default
      accentColor: { type: String, default: '#f43f5e' },
    },
    address: {
      street: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    currency: {
      type: String,
      default: 'INR',
    },
    customDomain: {
      domain: {
        type: String,
        lowercase: true,
        trim: true,
      },
      status: {
        type: String,
        enum: ['NONE', 'PENDING_DNS', 'ACTIVE', 'ERROR'],
        default: 'NONE',
      },
      dnsTarget: {
        type: String,
        default: 'cname.clothing-saas-eight.vercel.app',
      },
      dnsRecords: [
        {
          recordType: { type: String, default: 'CNAME' },
          name: { type: String, default: '@' },
          value: { type: String, default: 'cname.clothing-saas-eight.vercel.app' },
          description: { type: String, default: '' },
        },
      ],
      verifiedAt: {
        type: Date,
      },
      sslStatus: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'ERROR'],
        default: 'PENDING',
      },
      lastDnsCheckError: {
        type: String,
        default: '',
      },
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
storeSchema.index({ 'customDomain.domain': 1 }, { unique: true, sparse: true });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
