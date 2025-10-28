// Public product routes (simple + compatible with current controllers)
const express = require('express');
const router = express.Router();

const productManageController = require('../controller/productManageController');

// Lấy tất cả sản phẩm
router.get('/', productManageController.getAllProducts);

// Lấy sản phẩm theo id hoặc slug
router.get('/:identifier', productManageController.getProductById);

module.exports = router;