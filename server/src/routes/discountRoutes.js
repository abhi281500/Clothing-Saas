const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { requireAuth } = require('../middlewares/auth');
const { requireStoreScope } = require('../middlewares/tenant');

// All seller discount routes require authentication and tenant scoping
router.use(requireAuth, requireStoreScope);

router.get('/', discountController.listDiscounts);
router.post('/', discountController.createDiscount);
router.delete('/:id', discountController.deleteDiscount);

module.exports = router;
