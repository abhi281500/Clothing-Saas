const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');
const { requireStoreScope } = require('../middlewares/tenant');

// All seller order routes require authentication and tenant scoping
router.use(requireAuth, requireStoreScope);

router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id/status', orderController.updateStatus);

module.exports = router;
