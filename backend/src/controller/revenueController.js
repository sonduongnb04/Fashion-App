// Controller báo cáo doanh thu chi tiết
const Response = require('../utils/responseHelper');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Top khách hàng mua nhiều nhất (theo tổng tiền đơn hoàn thành)
const topCustomers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const results = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$user', totalSpent: { $sum: '$amounts.total' }, orderCount: { $sum: 1 } } },
            { $sort: { totalSpent: -1 } },
            { $limit: parseInt(limit) },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    userId: '$_id',
                    userName: { $ifNull: ['$userInfo.username', 'Unknown'] },
                    email: { $ifNull: ['$userInfo.email', ''] },
                    totalSpent: 1,
                    orderCount: 1
                }
            }
        ]);
        return Response.success(res, results, 'Top khách hàng');
    } catch (error) {
        console.error('Top customers error:', error);
        return Response.serverError(res, 'Lỗi khi lấy top khách hàng');
    }
};

// Doanh thu theo tháng
const revenueByMonth = async (req, res) => {
    try {
        const { year } = req.query;
        const match = { status: 'completed' };
        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${parseInt(year) + 1}-01-01`);
            match.createdAt = { $gte: startDate, $lt: endDate };
        }
        const results = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    revenue: { $sum: '$amounts.total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        return Response.success(res, results, 'Doanh thu theo tháng');
    } catch (error) {
        console.error('Revenue by month error:', error);
        return Response.serverError(res, 'Lỗi khi lấy doanh thu theo tháng');
    }
};

// Doanh thu theo tuần
const revenueByWeek = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { status: 'completed' };
        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }
        const results = await Order.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        week: { $week: '$createdAt' }
                    },
                    revenue: { $sum: '$amounts.total' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.week': 1 } }
        ]);
        return Response.success(res, results, 'Doanh thu theo tuần');
    } catch (error) {
        console.error('Revenue by week error:', error);
        return Response.serverError(res, 'Lỗi khi lấy doanh thu theo tuần');
    }
};

// Doanh thu theo danh mục sản phẩm (đã phân bổ cả phí vận chuyển theo đơn)
const revenueByCategory = async (req, res) => {
    try {
        // Quy tắc phân bổ: chia đều phí ship của mỗi đơn cho số danh mục xuất hiện trong đơn đó
        const results = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: '$items' },
            // Lấy thông tin sản phẩm và danh mục
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productInfo.category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
            // Gom theo (đơn, danh mục) để lấy doanh thu sản phẩm theo danh mục trong đơn
            {
                $group: {
                    _id: { orderId: '$_id', categoryId: '$categoryInfo._id' },
                    orderShipping: { $first: '$amounts.shipping' },
                    categoryName: { $first: { $ifNull: ['$categoryInfo.name', 'Không phân loại'] } },
                    itemRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    itemCount: { $sum: '$items.quantity' }
                }
            },
            // Gom theo đơn để đếm số danh mục xuất hiện trong đơn
            {
                $group: {
                    _id: '$_id.orderId',
                    shipping: { $first: '$orderShipping' },
                    categoryCount: { $sum: 1 },
                    categories: {
                        $push: {
                            categoryId: '$_id.categoryId',
                            categoryName: '$categoryName',
                            itemRevenue: '$itemRevenue',
                            itemCount: '$itemCount'
                        }
                    }
                }
            },
            { $unwind: '$categories' },
            // Phân bổ phí ship đều theo số danh mục trong đơn
            {
                $addFields: {
                    shippingShare: {
                        $cond: [
                            { $gt: ['$categoryCount', 0] },
                            { $divide: ['$shipping', '$categoryCount'] },
                            0
                        ]
                    },
                    revenueWithShipping: { $add: ['$categories.itemRevenue', { $cond: [{ $gt: ['$categoryCount', 0] }, { $divide: ['$shipping', '$categoryCount'] }, 0] }] }
                }
            },
            // Tổng hợp cuối cùng theo danh mục
            {
                $group: {
                    _id: '$categories.categoryId',
                    categoryName: { $first: '$categories.categoryName' },
                    revenue: { $sum: '$revenueWithShipping' },
                    itemCount: { $sum: '$categories.itemCount' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        return Response.success(res, results, 'Doanh thu theo danh mục');
    } catch (error) {
        console.error('Revenue by category error:', error);
        return Response.serverError(res, 'Lỗi khi lấy doanh thu theo danh mục');
    }
};

module.exports = {
    topCustomers,
    revenueByMonth,
    revenueByWeek,
    revenueByCategory
};

