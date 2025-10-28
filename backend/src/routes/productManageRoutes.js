const express = require('express');
const router = express.Router();

const productManageController = require('../controller/productManageController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');

// Các endpoint quản trị sản phẩm (yêu cầu đăng nhập + quyền admin)
router.post('/', auth, requireAdmin, productManageController.createProduct);
router.put('/:id', auth, requireAdmin, productManageController.updateProduct);
router.delete('/:id', auth, requireAdmin, productManageController.deleteProduct);
router.patch('/:id/stock', auth, requireAdmin, productManageController.updateProductStock);
router.patch('/:id/toggle', auth, requireAdmin, productManageController.toggleProductStatus);

module.exports = router;


