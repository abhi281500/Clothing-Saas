const storeService = require('../services/storeService');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const discountService = require('../services/discountService');
const campaignService = require('../services/campaignService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class StorefrontController {
  // Get public store profile
  async getStoreInfo(req, res, next) {
    try {
      const { slug } = req.params;
      const store = await storeService.getPublicStoreBySlug(slug);
      return successResponse(res, store, 'Store details');
    } catch (error) {
      next(error);
    }
  }

  // Get public store deals and promotions
  async getDeals(req, res, next) {
    try {
      const { slug } = req.params;
      const store = await storeService.getPublicStoreBySlug(slug);
      const deals = await campaignService.getPublicStoreDeals(store._id);
      return successResponse(res, deals, 'Store deals and promotions');
    } catch (error) {
      next(error);
    }
  }

  // Get public catalog
  async getCatalog(req, res, next) {
    try {
      const { slug } = req.params;
      const { category, search, sort } = req.query;
      const store = await storeService.getPublicStoreBySlug(slug);
      const [products, allCategories] = await Promise.all([
        productService.listPublicProducts(store._id, {
          category,
          search,
          sort,
        }),
        storeService.getStoreCategories(store._id),
      ]);
      return successResponse(res, { store, products, categories: allCategories }, 'Store catalog');
    } catch (error) {
      next(error);
    }
  }

  // Get single product detail
  async getProductDetail(req, res, next) {
    try {
      const { slug, productSlug } = req.params;
      const store = await storeService.getPublicStoreBySlug(slug);
      const product = await productService.getPublicProductBySlug(store._id, productSlug);
      return successResponse(res, { store, product }, 'Product details');
    } catch (error) {
      next(error);
    }
  }

  // Validate discount code for cart
  async validateCoupon(req, res, next) {
    try {
      const { slug } = req.params;
      const { code, subtotalPaise } = req.body;

      if (!code) {
        return errorResponse(res, 'Discount code is required', 400);
      }

      const store = await storeService.getPublicStoreBySlug(slug);
      const result = await discountService.validateDiscount(store._id, code, subtotalPaise || 0);
      return successResponse(res, result, 'Discount applied');
    } catch (error) {
      next(error);
    }
  }

  // Place order at checkout
  async checkout(req, res, next) {
    try {
      const { slug } = req.params;
      const { customer, items, discountCode, paymentMethod, customerNotes } = req.body;

      if (!customer || !customer.name || !customer.phone || !customer.shippingAddress) {
        return errorResponse(res, 'Full customer name, phone number, and shipping address are required', 400);
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Checkout requires at least one item', 400);
      }

      const store = await storeService.getPublicStoreBySlug(slug);

      const order = await orderService.createOrder({
        storeId: store._id,
        customer,
        items,
        discountCode,
        paymentMethod: paymentMethod || 'COD',
        customerNotes,
      });

      return successResponse(res, order, 'Order placed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Customer order tracking
  async trackOrder(req, res, next) {
    try {
      const { slug } = req.params;
      const { orderNumber, phone } = req.query;

      if (!orderNumber || !phone) {
        return errorResponse(res, 'Order number and phone number are required to track an order', 400);
      }

      const store = await storeService.getPublicStoreBySlug(slug);
      const order = await orderService.getPublicOrderTracking(store._id, orderNumber, phone);
      return successResponse(res, order, 'Order tracking details');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StorefrontController();
