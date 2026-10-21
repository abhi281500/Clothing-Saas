const express = require('express');
const router = express.Router();
const storefrontController = require('../controllers/storefrontController');
const { checkoutLimiter } = require('../middlewares/rateLimiter');

// Public storefront endpoints for shoppers (no seller auth required)
router.get('/:slug', storefrontController.getStoreInfo);
router.get('/:slug/catalog', storefrontController.getCatalog);
router.get('/:slug/products/:productSlug', storefrontController.getProductDetail);
router.post('/:slug/validate-coupon', storefrontController.validateCoupon);
router.post('/:slug/checkout', checkoutLimiter, storefrontController.checkout);
router.get('/:slug/track-order', storefrontController.trackOrder);

module.exports = router;
