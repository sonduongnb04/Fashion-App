const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart
} = require('../controller/cartController');
const auth = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Lấy giỏ hàng của user
// @access  Private
router.get('/', auth, getCart);

// @route   POST /api/cart
// @desc    Thêm sản phẩm vào giỏ hàng
// @access  Private
router.post('/', auth, addToCart);

// @route   DELETE /api/cart/:cartItemId
// @desc    Xóa sản phẩm khỏi giỏ hàng
// @access  Private
router.delete('/:cartItemId', auth, (req, res) => {
    const { cartItemId } = req.params;
    removeFromCart({ ...req, body: { cartItemId } }, res);
});

// @route   PUT /api/cart/:cartItemId
// @desc    Cập nhật số lượng sản phẩm
// @access  Private
router.put('/:cartItemId', auth, (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    updateCartItem({ ...req, body: { cartItemId, quantity } }, res);
});

// @route   DELETE /api/cart
// @desc    Xóa toàn bộ giỏ hàng
// @access  Private
router.delete('/', auth, clearCart);

module.exports = router;


