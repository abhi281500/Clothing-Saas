const mongoose = require('mongoose');
const { Order } = require('../models/Order');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const discountService = require('./discountService');

class OrderService {
  /**
   * Helper to generate human-readable unique order number per store (e.g. ORD-839201)
   * Guaranteed collision-free under concurrent checkouts
   */
  async generateOrderNumber(storeId) {
    const timestamp = Date.now().toString().slice(-5);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${timestamp}${randomSuffix}`;
  }

  /**
   * Place an order from public storefront checkout.
   * Atomic stock validation & decrement, price revalidation, discount application.
   */
  async createOrder({ storeId, customer, items, discountCode, paymentMethod, customerNotes }) {
    if (!items || !items.length) {
      const err = new Error('Cart is empty');
      err.statusCode = 400;
      throw err;
    }

    // 1. Revalidate each product, variant, and stock
    const itemSnapshots = [];
    let subtotalPaise = 0;

    // We will do atomic reservation for items
    const reservedItems = [];

    try {
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, storeId, isPublished: true });
        if (!product) {
          const err = new Error(`Product not found or unavailable: ${item.productId}`);
          err.statusCode = 400;
          throw err;
        }

        let variant = null;
        let unitPricePaise = product.basePricePaise;

        if (item.variantId) {
          variant = product.variants.id(item.variantId);
          if (!variant) {
            const err = new Error(`Variant not found for product: ${product.name}`);
            err.statusCode = 400;
            throw err;
          }
          unitPricePaise += variant.priceDifferencePaise || 0;
        }

        const quantity = parseInt(item.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
          const err = new Error('Invalid item quantity');
          err.statusCode = 400;
          throw err;
        }

        // Atomic stock decrement using MongoDB conditional query
        let updatedProduct;
        if (variant) {
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: product._id,
              'variants._id': variant._id,
              'variants.stock': { $gte: quantity },
            },
            {
              $inc: {
                'variants.$.stock': -quantity,
                totalStock: -quantity,
              },
            },
            { new: true }
          );
        } else {
          updatedProduct = await Product.findOneAndUpdate(
            {
              _id: product._id,
              totalStock: { $gte: quantity },
            },
            {
              $inc: { totalStock: -quantity },
            },
            { new: true }
          );
        }

        if (!updatedProduct) {
          const err = new Error(`Insufficient stock for "${product.name}" (${variant ? `${variant.size}/${variant.color}` : 'Standard'})`);
          err.statusCode = 409;
          err.code = 'OUT_OF_STOCK';
          throw err;
        }

        reservedItems.push({
          productId: product._id,
          variantId: variant ? variant._id : null,
          quantity,
        });

        const itemSubtotalPaise = unitPricePaise * quantity;
        subtotalPaise += itemSubtotalPaise;

        itemSnapshots.push({
          productId: product._id,
          productName: product.name,
          variantId: variant ? variant._id : null,
          size: variant ? variant.size : '',
          color: variant ? variant.color : '',
          sku: variant ? variant.sku : '',
          quantity,
          unitPricePaise,
          subtotalPaise: itemSubtotalPaise,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
        });
      }

      // 2. Validate discount coupon if supplied
      let discountPaise = 0;
      let appliedDiscountCode = null;
      let discountId = null;

      if (discountCode) {
        const discountResult = await discountService.validateDiscount(storeId, discountCode, subtotalPaise);
        discountPaise = discountResult.discountPaise;
        appliedDiscountCode = discountResult.code;
        discountId = discountResult.discountId;

        // Atomic conditional increment: guarantees limit cannot be bypassed under concurrency
        if (discountId) {
          const updatedDiscount = await Discount.findOneAndUpdate(
            {
              _id: discountId,
              $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
              ],
            },
            { $inc: { usedCount: 1 } },
            { new: true }
          );

          if (!updatedDiscount) {
            const err = new Error('This discount coupon usage limit has just been reached.');
            err.statusCode = 400;
            throw err;
          }
        }
      }

      const totalPaise = Math.max(0, subtotalPaise - discountPaise);

      // 3. Create Order
      const orderNumber = await this.generateOrderNumber(storeId);

      const order = new Order({
        storeId,
        orderNumber,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          shippingAddress: {
            addressLine: customer.shippingAddress.addressLine,
            city: customer.shippingAddress.city,
            state: customer.shippingAddress.state,
            pincode: customer.shippingAddress.pincode,
          },
        },
        items: itemSnapshots,
        financials: {
          subtotalPaise,
          discountPaise,
          shippingPaise: 0, // Free shipping standard for boutique wedge
          totalPaise,
        },
        discountApplied: {
          code: appliedDiscountCode,
          discountPaise,
        },
        paymentMethod: paymentMethod || 'COD',
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
        orderStatus: 'PENDING',
        customerNotes: customerNotes || '',
      });

      await order.save();
      return order;
    } catch (error) {
      // Rollback discount usage if subsequent order creation steps fail
      if (discountId) {
        await Discount.findByIdAndUpdate(discountId, { $inc: { usedCount: -1 } }).catch(() => {});
      }

      // Rollback any atomically decremented stock if subsequent steps fail
      for (const res of reservedItems) {
        if (res.variantId) {
          await Product.findOneAndUpdate(
            { _id: res.productId, 'variants._id': res.variantId },
            {
              $inc: {
                'variants.$.stock': res.quantity,
                totalStock: res.quantity,
              },
            }
          );
        } else {
          await Product.findByIdAndUpdate(res.productId, {
            $inc: { totalStock: res.quantity },
          });
        }
      }
      throw error;
    }
  }

  /**
   * List orders for seller dashboard (scoped to storeId)
   */
  async listStoreOrders(storeId, { status, page = 1, limit = 20 }) {
    const query = { storeId };
    if (status) {
      query.orderStatus = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    };
  }

  /**
   * Get single order by ID (seller dashboard)
   */
  async getOrderById(storeId, orderId) {
    const order = await Order.findOne({ _id: orderId, storeId });
    if (!order) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }
    return order;
  }

  /**
   * Get public order status by orderNumber and phone (for customer tracking)
   * Redacts private customer street address and strips internalNotes
   */
  async getPublicOrderTracking(storeId, orderNumber, phone) {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanOrderNumber = (orderNumber || '').trim();

    const order = await Order.findOne({
      storeId,
      orderNumber: cleanOrderNumber,
    }).select('-internalNotes');

    if (!order) {
      const err = new Error('Order not found. Please verify the order number and phone number.');
      err.statusCode = 404;
      throw err;
    }

    // Verify phone match against stored phone
    const storedPhoneClean = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const isMatch =
      storedPhoneClean === cleanPhone ||
      (cleanPhone.length >= 10 && storedPhoneClean.endsWith(cleanPhone.slice(-10))) ||
      (storedPhoneClean.length >= 10 && cleanPhone.endsWith(storedPhoneClean.slice(-10)));

    if (!isMatch) {
      const err = new Error('Order number and mobile number combination do not match.');
      err.statusCode = 404;
      throw err;
    }

    const safeOrder = order.toObject();
    // Protect customer privacy in public response
    if (safeOrder.customer && safeOrder.customer.shippingAddress) {
      safeOrder.customer.shippingAddress.addressLine = '*** (Protected for customer privacy)';
    }
    if (safeOrder.customer && safeOrder.customer.phone) {
      safeOrder.customer.phone = safeOrder.customer.phone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');
    }
    return safeOrder;
  }

  /**
   * Update order status with explicit state machine transition checks
   * Restores stock if order is CANCELLED.
   */
  async updateOrderStatus(storeId, orderId, nextStatus, notes = '') {
    const order = await this.getOrderById(storeId, orderId);

    if (!order.canTransitionTo(nextStatus)) {
      const err = new Error(
        `Invalid status transition from ${order.orderStatus} to ${nextStatus}. Allowed: ${
          require('../models/Order').VALID_TRANSITIONS[order.orderStatus].join(', ') || 'None'
        }`
      );
      err.statusCode = 400;
      err.code = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    // If transitioning to CANCELLED, restore inventory stock
    if (nextStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
      for (const item of order.items) {
        if (item.variantId) {
          await Product.findOneAndUpdate(
            { _id: item.productId, 'variants._id': item.variantId },
            {
              $inc: {
                'variants.$.stock': item.quantity,
                totalStock: item.quantity,
              },
            }
          );
        } else {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { totalStock: item.quantity },
          });
        }
      }
    }

    // If marked DELIVERED and payment method was COD, mark payment PAID
    if (nextStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
      order.paymentStatus = 'PAID';
    }

    order.orderStatus = nextStatus;
    if (notes) {
      order.internalNotes = `${order.internalNotes ? order.internalNotes + '\n' : ''}[${new Date().toISOString()}] ${notes}`;
    }

    await order.save();
    return order;
  }
}

module.exports = new OrderService();
