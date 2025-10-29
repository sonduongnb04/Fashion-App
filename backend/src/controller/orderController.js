// Quản lý đơn hàng lưu DB (Mongoose)
const Response = require('../utils/responseHelper');
const Order = require('../models/Order');

const create = async (req, res) => {
    try {
        const { items = [], amounts = {}, status = 'created', notes, meta } = req.body || {};

        // Require user to be authenticated
        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để tạo đơn hàng');
        }

        if (!Array.isArray(items) || items.length === 0) {
            return Response.error(res, 'Đơn hàng trống', 400);
        }
        if (amounts.subtotal == null || amounts.total == null) {
            return Response.error(res, 'Thiếu thông tin tiền hàng', 400);
        }

        console.log('📝 Creating order for user:', req.user.id, 'Items:', items.length, 'Total:', amounts.total);

        // Trừ tồn kho sản phẩm
        const Product = require('../models/Product');
        for (const item of items) {
            const productId = item.productId || item.product;
            if (productId) {
                try {
                    const product = await Product.findById(productId);
                    if (product && product.stock && product.stock.quantity >= item.quantity) {
                        product.stock.quantity -= item.quantity;
                        await product.save();
                        console.log(`✅ Reduced stock for ${product.name}: -${item.quantity}`);
                    }
                } catch (e) {
                    console.error('⚠️ Stock reduction error for product:', productId, e);
                }
            }
        }

        const order = await Order.create({
            user: req.user.id,  // FORCE set user ID from auth
            items,
            amounts: {
                subtotal: Number(amounts.subtotal) || 0,
                tax: Number(amounts.tax) || 0,
                shipping: Number(amounts.shipping) || 0,
                total: Number(amounts.total) || 0
            },
            status,
            notes,
            meta
        });

        console.log('✅ Order created:', order.code, 'Order ID:', order._id);
        return Response.created(res, order, 'Đã tạo đơn hàng');
    } catch (error) {
        console.error('❌ Create order error:', error);
        return Response.serverError(res, 'Không tạo được đơn hàng');
    }
};

const getById = async (req, res) => {
    try {
        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để xem đơn hàng');
        }
        const { id } = req.params;
        const filter = { _id: id };
        // Người dùng thường chỉ xem đơn của chính họ; admin xem được tất cả
        if (req.user?.role !== 'admin') {
            filter.user = req.user.id;
        }
        const order = await Order.findOne(filter)
            .populate('user', 'username email')
            .populate('items.product', 'name slug price mainImage images');
        if (!order) return Response.notFound(res, 'Không tìm thấy đơn hàng');
        return Response.success(res, order, 'Chi tiết đơn hàng');
    } catch (error) {
        console.error('Get order error:', error);
        if (error?.name === 'CastError') {
            return Response.error(res, 'ID không hợp lệ', 400);
        }
        return Response.serverError(res, 'Lỗi khi lấy đơn hàng');
    }
};

const list = async (req, res) => {
    try {
        // MUST filter by current user
        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để xem đơn hàng');
        }

        const { page = 1, limit = 20, status } = req.query;
        const filter = {};
        // Người dùng thường chỉ nhìn thấy đơn của chính họ; admin xem được tất cả
        if (req.user?.role !== 'admin') {
            filter.user = req.user.id;
        }
        if (status) filter.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        console.log('📋 Fetching orders for user:', req.user.id, 'Status filter:', status);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('user', 'username email')
                .populate('items.product', 'name slug price mainImage images'),
            Order.countDocuments(filter)
        ]);

        console.log('✅ Orders fetched:', orders.length, 'Total:', total);
        return Response.success(res, { orders, total, page: parseInt(page), limit: parseInt(limit) }, 'Danh sách đơn hàng');
    } catch (error) {
        console.error('❌ List orders error:', error);
        return Response.serverError(res, 'Lỗi khi lấy danh sách đơn hàng');
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        const order = await Order.findById(id);
        if (!order) return Response.notFound(res, 'Không tìm thấy đơn hàng');
        if (status) order.status = status;
        await order.save();
        return Response.success(res, order, 'Đã cập nhật trạng thái');
    } catch (error) {
        console.error('Update order status error:', error);
        return Response.serverError(res, 'Lỗi khi cập nhật trạng thái đơn hàng');
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const existed = await Order.findByIdAndDelete(id);
        if (!existed) return Response.notFound(res, 'Không tìm thấy đơn hàng');
        return Response.noContent(res);
    } catch (error) {
        console.error('Delete order error:', error);
        return Response.serverError(res, 'Lỗi khi xóa đơn hàng');
    }
};

module.exports = {
    create,
    getById,
    list,
    updateStatus,
    remove
};


