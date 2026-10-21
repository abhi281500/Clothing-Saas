const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth } = require('../middlewares/auth');
const { requireStoreScope } = require('../middlewares/tenant');

// All seller product routes require authentication and tenant scoping
router.use(requireAuth, requireStoreScope);

router.get('/', productController.listProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
