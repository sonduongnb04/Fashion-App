// Controller giỏ hàng
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ResponseHelper = require('../utils/responseHelper');

// Lấy giỏ hàng của user
const getCart = async (req, res) => {
    try {
        console.log('📦 Getting cart for user:', req.user.id);
        let cart = await Cart.findOne({ userId: req.user.id }).populate('items.product');

        if (!cart) {
            console.log('🆕 Creating new cart for user:', req.user.id);
            cart = new Cart({ userId: req.user.id, items: [] });
            await cart.save();
        }

        console.log('✅ Cart found:', cart.items.length, 'items');
        return ResponseHelper.success(res, cart, 'Lấy giỏ hàng thành công');
    } catch (error) {
        console.error('❌ Get cart error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi lấy giỏ hàng');
    }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, selectedColor, selectedSize } = req.body;

        console.log('➕ Adding to cart:', productId, 'qty:', quantity);

        if (!productId) {
            return ResponseHelper.error(res, 'Thiếu productId', 400);
        }

        const product = await Product.findById(productId);
        if (!product) {
            return ResponseHelper.error(res, 'Sản phẩm không tồn tại', 404);
        }

        let cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            cart = new Cart({ userId: req.user.id, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId &&
                item.selectedColor === selectedColor &&
                item.selectedSize === selectedSize
        );

        if (existingItem) {
            console.log('📈 Updating quantity');
            existingItem.quantity += quantity;
        } else {
            console.log('🆕 Adding new item');
            cart.items.push({
                product: productId,
                quantity,
                selectedColor,
                selectedSize
            });
        }

        await cart.save();
        await cart.populate('items.product');

        console.log('💾 Cart saved:', cart.items.length, 'items');
        return ResponseHelper.success(res, cart, 'Thêm vào giỏ hàng thành công');
    } catch (error) {
        console.error('❌ Add to cart error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi thêm vào giỏ hàng');
    }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.body;

        console.log('➖ Removing from cart:', cartItemId);

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return ResponseHelper.error(res, 'Giỏ hàng không tồn tại', 404);
        }

        cart.items = cart.items.filter(item => item._id.toString() !== cartItemId);
        await cart.save();
        await cart.populate('items.product');

        console.log('🗑️ Item removed');
        return ResponseHelper.success(res, cart, 'Xóa khỏi giỏ hàng thành công');
    } catch (error) {
        console.error('❌ Remove from cart error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi xóa khỏi giỏ hàng');
    }
};

// Cập nhật số lượng sản phẩm
const updateCartItem = async (req, res) => {
    try {
        const { cartItemId, quantity } = req.body;

        console.log('🔄 Updating cart item:', cartItemId, 'qty:', quantity);

        const cart = await Cart.findOne({ userId: req.user.id });
        if (!cart) {
            return ResponseHelper.error(res, 'Giỏ hàng không tồn tại', 404);
        }

        const item = cart.items.find(i => i._id.toString() === cartItemId);
        if (!item) {
            return ResponseHelper.error(res, 'Sản phẩm không có trong giỏ hàng', 404);
        }

        if (quantity <= 0) {
            cart.items = cart.items.filter(i => i._id.toString() !== cartItemId);
        } else {
            item.quantity = quantity;
        }

        await cart.save();
        await cart.populate('items.product');

        console.log('✅ Cart item updated');
        return ResponseHelper.success(res, cart, 'Cập nhật giỏ hàng thành công');
    } catch (error) {
        console.error('❌ Update cart error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi cập nhật giỏ hàng');
    }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
    try {
        console.log('🧹 Clearing cart for user:', req.user.id);

        const cart = await Cart.findOne({ userId: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return ResponseHelper.success(res, { items: [] }, 'Xóa giỏ hàng thành công');
    } catch (error) {
        console.error('❌ Clear cart error:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi xóa giỏ hàng');
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart
};


