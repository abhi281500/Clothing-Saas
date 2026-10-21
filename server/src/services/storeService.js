const Store = require('../models/Store');
const Product = require('../models/Product');
const { Order } = require('../models/Order');

class StoreService {
  /**
   * Get public store profile by slug for the customer storefront
   */
  async getPublicStoreBySlug(slug) {
    const store = await Store.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!store) {
      const err = new Error('Store not found or currently unavailable');
      err.statusCode = 404;
      err.code = 'STORE_NOT_FOUND';
      throw err;
    }
    return store;
  }

  /**
   * Update store settings (strictly authorized for store owner)
   */
  async updateStore(storeId, updateData) {
    const allowedFields = [
      'name',
      'tagline',
      'description',
      'whatsappNumber',
      'instagramHandle',
      'branding',
      'address',
    ];

    const safeUpdate = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        safeUpdate[key] = updateData[key];
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, safeUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updatedStore) {
      const err = new Error('Store not found');
      err.statusCode = 404;
      throw err;
    }

    return updatedStore;
  }

  /**
   * Get store operational overview / dashboard stats
   */
  async getStoreStats(storeId) {
    const [totalProducts, totalOrders, recentOrders, orderStats] = await Promise.all([
      Product.countDocuments({ storeId }),
      Order.countDocuments({ storeId }),
      Order.find({ storeId }).sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $match: { storeId: storeId } },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
            revenuePaise: { $sum: '$financials.totalPaise' },
          },
        },
      ]),
    ]);

    let totalRevenuePaise = 0;
    const statusCounts = {
      PENDING: 0,
      CONFIRMED: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    orderStats.forEach((stat) => {
      if (statusCounts[stat._id] !== undefined) {
        statusCounts[stat._id] = stat.count;
      }
      if (stat._id !== 'CANCELLED') {
        totalRevenuePaise += stat.revenuePaise || 0;
      }
    });

    return {
      totalProducts,
      totalOrders,
      totalRevenuePaise,
      statusCounts,
      recentOrders,
    };
  }
}

module.exports = new StoreService();
