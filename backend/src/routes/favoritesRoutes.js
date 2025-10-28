const express = require('express');
const router = express.Router();
const {
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite
} = require('../controller/favoritesController');
const auth = require('../middleware/auth');

// @route   GET /api/favorites
// @desc    Lấy danh sách yêu thích của user
// @access  Private
router.get('/', auth, getFavorites);

// @route   POST /api/favorites
// @desc    Thêm vào yêu thích
// @access  Private
router.post('/', auth, addToFavorites);

// @route   DELETE /api/favorites
// @desc    Xóa khỏi yêu thích
// @access  Private
router.delete('/', auth, removeFromFavorites);

// @route   GET /api/favorites/:productId
// @desc    Kiểm tra sản phẩm có trong yêu thích
// @access  Private
router.get('/check/:productId', auth, isFavorite);

module.exports = router;
