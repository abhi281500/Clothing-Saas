const Discount = require('../models/Discount');

class DiscountService {
  /**
   * List all discounts for a store (seller)
   */
  async listStoreDiscounts(storeId) {
    return Discount.find({ storeId }).sort({ createdAt: -1 });
  }

  /**
   * Create discount code for a store
   */
  async createDiscount(storeId, data) {
    const { code, type, value, minOrderPaise, maxDiscountPaise, usageLimit, validUntil } = data;

    const existing = await Discount.findOne({ storeId, code: code.toUpperCase() });
    if (existing) {
      const err = new Error('A discount code with this name already exists.');
      err.statusCode = 409;
      throw err;
    }

    const discount = new Discount({
      storeId,
      code: code.toUpperCase(),
      type: type || 'PERCENT',
      value: Number(value),
      minOrderPaise: Number(minOrderPaise) || 0,
      maxDiscountPaise: Number(maxDiscountPaise) || 0,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
    });

    return discount.save();
  }

  /**
   * Delete discount code
   */
  async deleteDiscount(storeId, discountId) {
    const deleted = await Discount.findOneAndDelete({ _id: discountId, storeId });
    if (!deleted) {
      const err = new Error('Discount not found');
      err.statusCode = 404;
      throw err;
    }
    return deleted;
  }

  /**
   * Validate and apply discount code for checkout
   * @param {ObjectId} storeId
   * @param {string} code
   * @param {number} subtotalPaise
   */
  async validateDiscount(storeId, code, subtotalPaise) {
    if (!code) return { discountPaise: 0, discount: null };

    const discount = await Discount.findOne({
      storeId,
      code: code.trim().toUpperCase(),
      isActive: true,
    });

    if (!discount) {
      const err = new Error('Invalid or expired discount coupon');
      err.statusCode = 400;
      throw err;
    }

    // Check expiration
    if (discount.validUntil && new Date() > discount.validUntil) {
      const err = new Error('This discount coupon has expired');
      err.statusCode = 400;
      throw err;
    }

    // Check usage limit
    if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
      const err = new Error('This discount coupon usage limit has been reached');
      err.statusCode = 400;
      throw err;
    }

    // Check minimum order
    if (discount.minOrderPaise > 0 && subtotalPaise < discount.minOrderPaise) {
      const err = new Error(
        `This coupon requires a minimum order amount of ₹${(discount.minOrderPaise / 100).toFixed(2)}`
      );
      err.statusCode = 400;
      throw err;
    }

    // Calculate discount amount in paise
    let discountPaise = 0;
    if (discount.type === 'PERCENT') {
      discountPaise = Math.round((subtotalPaise * discount.value) / 100);
      if (discount.maxDiscountPaise > 0 && discountPaise > discount.maxDiscountPaise) {
        discountPaise = discount.maxDiscountPaise;
      }
    } else if (discount.type === 'FLAT') {
      discountPaise = discount.value; // Stored in paise
      if (discountPaise > subtotalPaise) {
        discountPaise = subtotalPaise;
      }
    }

    return {
      discountPaise,
      code: discount.code,
      discountId: discount._id,
    };
  }
}

module.exports = new DiscountService();
