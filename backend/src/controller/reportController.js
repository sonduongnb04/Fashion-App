// Báo cáo doanh thu và top sản phẩm
const Response = require('../utils/responseHelper');
const Order = require('../models/Order');

// Báo cáo doanh thu theo khoảng ngày
const revenueReport = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const match = {};
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const dateExpr = groupBy === 'month'
            ? { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }
            : { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

        const results = await Order.aggregate([
            { $match: match },
            { $group: { _id: dateExpr, orders: { $sum: 1 }, revenue: { $sum: '$amounts.total' }, subtotal: { $sum: '$amounts.subtotal' }, tax: { $sum: '$amounts.tax' } } },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        return Response.success(res, { groupBy, results }, 'Báo cáo doanh thu');
    } catch (error) {
        console.error('Revenue report error:', error);
        return Response.serverError(res, 'Lỗi khi lấy báo cáo');
    }
};

// Top sản phẩm theo doanh thu/số lượng
const topProducts = async (req, res) => {
    try {
        const { startDate, endDate, metric = 'revenue', limit = 10 } = req.query;
        const match = {};
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const results = await Order.aggregate([
            { $match: match },
            { $unwind: '$items' },
            { $group: { _id: '$items.product', productId: { $first: '$items.product' }, fallbackId: { $first: '$items.productId' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
            { $sort: metric === 'quantity' ? { quantity: -1 } : { revenue: -1 } },
            { $limit: parseInt(limit) }
        ]);

        return Response.success(res, { metric, results }, 'Top sản phẩm');
    } catch (error) {
        console.error('Top products report error:', error);
        return Response.serverError(res, 'Lỗi khi lấy top sản phẩm');
    }
};

module.exports = { revenueReport, topProducts };


