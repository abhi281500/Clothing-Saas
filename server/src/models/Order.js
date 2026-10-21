const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    size: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    sku: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotalPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer phone number is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },
      shippingAddress: {
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
      },
    },
    items: [orderItemSnapshotSchema],
    financials: {
      subtotalPaise: {
        type: Number,
        required: true,
        min: 0,
      },
      discountPaise: {
        type: Number,
        default: 0,
        min: 0,
      },
      shippingPaise: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalPaise: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    discountApplied: {
      code: { type: String, default: null },
      discountPaise: { type: Number, default: 0 },
    },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE', 'WHATSAPP_CONFIRM'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    whatsappNotificationSent: {
      type: Boolean,
      default: false,
    },
    customerNotes: {
      type: String,
      default: '',
    },
    internalNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Explicit Valid State Transitions
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

orderSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = VALID_TRANSITIONS[this.orderStatus] || [];
  return allowed.includes(nextStatus);
};

// Compound Indexes
orderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ storeId: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  VALID_TRANSITIONS,
};
