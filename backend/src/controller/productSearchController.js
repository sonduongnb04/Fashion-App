// SCRUM-10: Controller tìm kiếm sản phẩm (BASIC ONLY)
const Product = require('../models/Product');
const Category = require('../models/Category');
const ResponseHelper = require('../utils/responseHelper');

// Tìm kiếm sản phẩm theo từ khóa (đơn giản hóa)
const searchProducts = async (req, res) => {
    try {
        const { q = '', page = 1, limit = 20, category, minPrice, maxPrice, inStock, sort = '-relevance', includeInactive = false } = req.query;
        if (!q.trim()) return ResponseHelper.error(res, 'Vui lòng nhập từ khóa tìm kiếm', 400);

        const filter = {};
        if (!includeInactive) filter.isActive = true;
        if (category) {
            const categoryDoc = await Category.findById(category);
            if (categoryDoc) {
                const allCategories = await Category.getAllSubcategories(category);
                const categoryIds = allCategories.map(cat => cat._id);
                filter.$or = [{ category: { $in: categoryIds } }, { subcategory: { $in: categoryIds } }];
            }
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (inStock === 'true') filter['stock.quantity'] = { $gt: 0 };

        const searchFilter = { ...filter, $text: { $search: q.trim() } };

        const pipeline = [
            { $match: searchFilter },
            {
                $addFields: {
                    searchScore: { $meta: 'textScore' },
                    relevanceScore: {
                        $add: [{ $meta: 'textScore' }, { $multiply: ['$views', 0.1] }, { $multiply: ['$sales', 0.2] }, { $multiply: ['$rating.average', 2] }]
                    }
                }
            }
        ];

        let sortStage = {};
        switch (sort) {
            case '-relevance': sortStage = { relevanceScore: -1, createdAt: -1 }; break;
            case 'price': sortStage = { price: 1 }; break;
            case '-price': sortStage = { price: -1 }; break;
            case '-rating': sortStage = { 'rating.average': -1, 'rating.count': -1 }; break;
            case '-sales': sortStage = { sales: -1 }; break;
            case '-views': sortStage = { views: -1 }; break;
            default: sortStage = { relevanceScore: -1, createdAt: -1 };
        }

        pipeline.push({ $sort: sortStage });
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

        const [products, totalResult] = await Promise.all([
            Product.aggregate(pipeline),
            Product.aggregate([{ $match: searchFilter }, { $count: 'total' }])
        ]);
        const total = totalResult[0]?.total || 0;

        return ResponseHelper.successWithPagination(res, products, { currentPage: parseInt(page), limit: parseInt(limit), total, query: q, searchTime: Date.now() }, `Tìm thấy ${total} sản phẩm phù hợp`);
    } catch (error) {
        console.error('Error in searchProducts:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi tìm kiếm sản phẩm');
    }
};

module.exports = { searchProducts };


