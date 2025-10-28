// Controller thanh toán (khung cơ bản, có thể tích hợp cổng sau)
const Response = require('../utils/responseHelper');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// Tạo yêu cầu thanh toán cho một đơn hàng
const initiate = async (req, res) => {
    try {
        const { orderId, provider = 'cod' } = req.body;

        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để tạo thanh toán');
        }

        const order = await Order.findById(orderId).populate('user', 'email username');
        if (!order) return Response.notFound(res, 'Không tìm thấy đơn hàng');
        if (order.amounts.total <= 0) return Response.error(res, 'Tổng tiền không hợp lệ', 400);

        // Verify user owns this order
        if (order.user._id.toString() !== req.user.id) {
            return Response.forbidden(res, 'Bạn không có quyền thanh toán cho đơn hàng này');
        }

        console.log('💳 Initiating payment for order:', orderId, 'Provider:', provider, 'Amount:', order.amounts.total);

        // Nếu đã có payment tồn tại, trả về
        let payment = await Payment.findOne({ order: order._id });
        if (!payment) {
            payment = await Payment.create({
                order: order._id,
                user: req.user.id,  // FORCE set user ID from auth
                provider,
                amount: order.amounts.total,
                status: provider === 'cod' ? 'authorized' : 'pending',
                meta: {
                    initiatedAt: new Date(),
                    userEmail: order.user.email,
                }
            });
        }

        console.log('✅ Payment created:', payment._id, 'Status:', payment.status);

        // Với COD coi như đã uỷ quyền, xác nhận sau khi giao hàng
        // Với các cổng online, ở đây bạn sẽ tạo paymentIntent và trả clientSecret/redirectUrl
        return Response.created(res, payment, 'Khởi tạo thanh toán thành công');
    } catch (error) {
        console.error('❌ Initiate payment error:', error);
        return Response.serverError(res, 'Không khởi tạo được thanh toán');
    }
};

// Xác nhận thanh toán (webhook hoặc client callback)
const confirm = async (req, res) => {
    try {
        const { paymentId, status = 'paid', providerRef, meta } = req.body;

        if (!req.user?.id) {
            return Response.unauthorized(res, 'Cần đăng nhập để xác nhận thanh toán');
        }

        const payment = await Payment.findById(paymentId).populate('order');
        if (!payment) return Response.notFound(res, 'Không tìm thấy payment');

        // Verify user owns this payment
        if (payment.user.toString() !== req.user.id) {
            return Response.forbidden(res, 'Bạn không có quyền xác nhận thanh toán này');
        }

        console.log('✅ Confirming payment:', paymentId, 'New status:', status);

        payment.status = status;
        if (providerRef) payment.providerRef = providerRef;
        if (meta) payment.meta = { ...(payment.meta || {}), ...meta };
        await payment.save();

        // Cập nhật trạng thái đơn theo payment
        if (status === 'paid' || status === 'authorized') {
            payment.order.status = 'paid';
            console.log('📦 Updating order status to paid:', payment.order._id);
            await payment.order.save();
        } else if (status === 'failed' || status === 'cancelled') {
            // tuỳ chính sách mà cập nhật order
            console.warn('⚠️ Payment failed/cancelled:', paymentId);
        }

        return Response.success(res, payment, 'Xác nhận thanh toán thành công');
    } catch (error) {
        console.error('❌ Confirm payment error:', error);
        return Response.serverError(res, 'Không xác nhận được thanh toán');
    }
};

// Lấy trạng thái thanh toán
const getStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id).populate('order', 'code status amounts total');
        if (!payment) return Response.notFound(res, 'Không tìm thấy payment');
        return Response.success(res, payment, 'Trạng thái thanh toán');
    } catch (error) {
        console.error('Get payment status error:', error);
        return Response.serverError(res, 'Lỗi khi lấy trạng thái thanh toán');
    }
};

module.exports = { initiate, confirm, getStatus };


