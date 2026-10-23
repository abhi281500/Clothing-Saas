const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const storeRoutes = require('./storeRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const discountRoutes = require('./discountRoutes');
const campaignRoutes = require('./campaignRoutes');
const storefrontRoutes = require('./storefrontRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Clothing Commerce SaaS API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Seller Auth routes
router.use('/auth', authRoutes);

// Seller Management routes (tenant scoped)
router.use('/stores', storeRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/discounts', discountRoutes);
router.use('/campaigns', campaignRoutes);

// Public Customer Storefront routes
router.use('/storefront', storefrontRoutes);

module.exports = router;
