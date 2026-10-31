const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { requireAuth } = require('../middlewares/auth');
const { requireStoreScope } = require('../middlewares/tenant');

// All seller store routes require authentication and tenant scoping
router.use(requireAuth, requireStoreScope);

router.get('/my-store', storeController.getMyStore);
router.patch('/my-store', storeController.updateMyStore);
router.get('/dashboard-stats', storeController.getDashboardStats);

// Custom Domain Management (Cloudflare for SaaS / CNAME mapping)
router.post('/my-store/custom-domain', storeController.setCustomDomain);
router.post('/my-store/verify-domain', storeController.verifyCustomDomain);
router.delete('/my-store/custom-domain', storeController.removeCustomDomain);

module.exports = router;
