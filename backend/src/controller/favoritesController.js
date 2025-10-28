// Controller yêu thích
const Favorite = require('../models/Favorite');
const ResponseHelper = require('../utils/responseHelper');

// Lấy danh sách yêu thích
const getFavorites = async (req, res) => {
    try {
        console.log('❤️ Getting favorites for user:', req.user.id);

        let favorite = await Favorite.findOne({ userId: req.user.id }).populate('products');

        if (!favorite) {
            console.log('🆕 Creating new favorites for user:', req.user.id);
            favorite = new Favorite({ userId: req.user.id, products: [] });
            await favorite.save();
        }

        console.log('✅ Favorites found:', favorite.products.length, 'items');
        return ResponseHelper.success(res, favorite.products, 'Lấy yêu thích thành công');
    } catch (error) {
        console.error('❌ Get favorites error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi lấy yêu thích');
    }
};

// Thêm vào yêu thích
const addToFavorites = async (req, res) => {
    try {
        const { productId } = req.body;

        console.log('💓 Adding to favorites:', productId);

        if (!productId) {
            return ResponseHelper.error(res, 'Thiếu productId', 400);
        }

        let favorite = await Favorite.findOne({ userId: req.user.id });
        if (!favorite) {
            favorite = new Favorite({ userId: req.user.id, products: [] });
        }

        if (!favorite.products.includes(productId)) {
            favorite.products.push(productId);
            await favorite.save();
            console.log('❤️ Added to favorites');
        } else {
            console.log('⚠️ Product already in favorites');
        }

        await favorite.populate('products');
        return ResponseHelper.success(res, favorite.products, 'Thêm vào yêu thích thành công');
    } catch (error) {
        console.error('❌ Add to favorites error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi thêm vào yêu thích');
    }
};

// Xóa khỏi yêu thích
const removeFromFavorites = async (req, res) => {
    try {
        const { productId } = req.body;

        console.log('💔 Removing from favorites:', productId);

        const favorite = await Favorite.findOne({ userId: req.user.id });
        if (!favorite) {
            return ResponseHelper.error(res, 'Yêu thích không tồn tại', 404);
        }

        favorite.products = favorite.products.filter(id => id.toString() !== productId);
        await favorite.save();

        console.log('🗑️ Removed from favorites');
        return ResponseHelper.success(res, favorite.products, 'Xóa khỏi yêu thích thành công');
    } catch (error) {
        console.error('❌ Remove from favorites error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi xóa khỏi yêu thích');
    }
};

// Kiểm tra sản phẩm có trong yêu thích
const isFavorite = async (req, res) => {
    try {
        const { productId } = req.params;

        const favorite = await Favorite.findOne({ userId: req.user.id });
        const isFav = favorite && favorite.products.includes(productId);

        return ResponseHelper.success(res, { isFavorite: isFav }, 'Kiểm tra thành công');
    } catch (error) {
        console.error('❌ Check favorite error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi kiểm tra yêu thích');
    }
};

module.exports = {
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite
};
