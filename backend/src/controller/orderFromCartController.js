// Tạo đơn từ giỏ hàng và lưu DB
const Response = require('../utils/responseHelper');
const Order = require('../models/Order');

// Trong tương lai có thể tích hợp với model Order và thanh toán
const createOrderFromCart = async (req, res) => {
    try {
        // REQUIRE authentication
        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để tạo đơn hàng');
        }

        const cart = (req.session && req.session.cart) || { items: [] };
        if (!cart.items.length) {
            return Response.error(res, 'Giỏ hàng trống', 400);
        }

        const subtotal = cart.items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
        const tax = Math.round(subtotal * 0.1);
        const total = subtotal + tax;

        console.log('📝 Creating order from cart for user:', req.user.id, 'Items:', cart.items.length, 'Total:', total);

        const order = await Order.create({
            user: req.user.id,  // FORCE set from auth ✓
            items: cart.items,
            amounts: {
                subtotal: Math.round(subtotal),
                tax,
                shipping: 0,
                total: Math.round(total)
            },
            status: 'created'
        });

        console.log('✅ Order created from cart:', order.code);

        // Xóa giỏ sau khi tạo đơn
        req.session = req.session || {};
        req.session.cart = { items: [] };

        return Response.created(res, order, 'Đã tạo đơn từ giỏ');
    } catch (error) {
        console.error('❌ Create order from cart error:', error);
        return Response.serverError(res, 'Không tạo được đơn hàng');
    }
};

module.exports = { createOrderFromCart };


