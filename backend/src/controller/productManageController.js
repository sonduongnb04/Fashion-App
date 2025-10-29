// Controller quản lý sản phẩm 
const Product = require('../models/Product');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const ResponseHelper = require('../utils/responseHelper');
const { QueryHelper } = require('../utils/queryHelpers');

// Lấy danh sách sản phẩm (phân trang + filter cơ bản)
const getAllProducts = async (req, res) => {
    try {
        const { page = 1, limit = 20, category, isActive, minPrice, maxPrice, inStock, isFeatured, hasDiscount, sort = '-createdAt' } = req.query;

        const filter = {};
        // Chỉ filter isActive nếu được truyền vào
        if (isActive !== undefined && isActive !== 'all') {
            filter.isActive = isActive === 'true';
        }

        if (category) {
            console.log('Filtering by category:', category);
            const categoryDoc = await Category.findById(category);
            if (categoryDoc) {
                console.log('Category found:', categoryDoc.name, categoryDoc._id);
                const allCategories = await Category.getAllSubcategories(category);
                const categoryIds = [categoryDoc._id, ...allCategories.map(cat => cat._id)];
                console.log('Category IDs to filter:', categoryIds.map(id => id.toString()));
                filter.$or = [{ category: { $in: categoryIds } }, { subcategory: { $in: categoryIds } }];
            } else {
                console.log('Category not found for ID:', category);
            }
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (inStock === 'true') filter['stock.quantity'] = { $gt: 0 };

        // Filter cho sản phẩm nổi bật
        if (isFeatured === 'true') {
            filter.isFeatured = true;
        }

        // Filter cho sản phẩm có giảm giá
        if (hasDiscount === 'true') {
            filter.discount = { $gt: 0 };
        }

        console.log('Product list filter:', JSON.stringify(filter));

        const queryHelper = new QueryHelper(Product.find(filter), req.query);
        const products = await queryHelper
            .sort()
            .paginate()
            .populate('category', 'name slug')
            .populate('subcategory', 'name slug')
            .populate('createdBy', 'username firstName lastName')
            .query;

        const total = await Product.countDocuments(filter);
        console.log(`getAllProducts: Found ${products.length} products (total: ${total})`);
        return ResponseHelper.successWithPagination(res, products, { currentPage: parseInt(page), limit: parseInt(limit), total }, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi lấy danh sách sản phẩm');
    }
};

// Lấy 1 sản phẩm theo id hoặc slug
const getProductById = async (req, res) => {
    try {
        const { identifier } = req.params;
        let product;
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) product = await Product.findById(identifier);
        else product = await Product.findOne({ slug: identifier });
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');
        if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
            return ResponseHelper.notFound(res, 'Sản phẩm không khả dụng');
        }
        await product.populate([
            { path: 'category', select: 'name slug path' },
            { path: 'subcategory', select: 'name slug' },
            { path: 'createdBy', select: 'username firstName lastName' }
        ]);
        Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();
        return ResponseHelper.success(res, product, 'Lấy thông tin sản phẩm thành công');
    } catch (error) {
        console.error('Error in getProductById:', error);
        if (error.name === 'CastError') return ResponseHelper.notFound(res, 'ID sản phẩm không hợp lệ');
        return ResponseHelper.serverError(res, 'Lỗi khi lấy thông tin sản phẩm');
    }
};

// Tạo sản phẩm
const createProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return ResponseHelper.validationError(res, errors.array());

        const productData = { ...req.body, createdBy: req.user.id };
        if (productData.category) {
            const exists = await Category.findById(productData.category);
            if (!exists) return ResponseHelper.error(res, 'Danh mục không tồn tại', 400);
        }
        if (productData.subcategory) {
            const exists = await Category.findById(productData.subcategory);
            if (!exists) return ResponseHelper.error(res, 'Danh mục con không tồn tại', 400);
        }
        if (productData.sku) {
            const existingSKU = await Product.findOne({ sku: productData.sku.toUpperCase() });
            if (existingSKU) return ResponseHelper.error(res, 'SKU đã tồn tại', 400);
        }

        const product = new Product(productData);
        await product.save();
        await product.populate([
            { path: 'category', select: 'name slug' },
            { path: 'subcategory', select: 'name slug' },
            { path: 'createdBy', select: 'username firstName lastName' }
        ]);
        if (product.category) Category.updateProductCount(product.category).catch(() => { });
        return ResponseHelper.created(res, product, 'Tạo sản phẩm thành công');
    } catch (error) {
        console.error('Error in createProduct:', error);
        if (error.code === 11000) {
            if (error.keyPattern.sku) return ResponseHelper.error(res, 'SKU đã tồn tại', 400);
            if (error.keyPattern.slug) return ResponseHelper.error(res, 'Slug đã tồn tại', 400);
        }
        return ResponseHelper.serverError(res, error?.message || 'Lỗi khi tạo sản phẩm');
    }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return ResponseHelper.validationError(res, errors.array());

        const { id } = req.params;
        const updateData = req.body;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');

        if (updateData.category && updateData.category !== product.category?.toString()) {
            const exists = await Category.findById(updateData.category);
            if (!exists) return ResponseHelper.error(res, 'Danh mục không tồn tại', 400);
        }
        if (updateData.subcategory && updateData.subcategory !== product.subcategory?.toString()) {
            const exists = await Category.findById(updateData.subcategory);
            if (!exists) return ResponseHelper.error(res, 'Danh mục con không tồn tại', 400);
        }
        if (updateData.sku && updateData.sku.toUpperCase() !== product.sku) {
            const existingSKU = await Product.findOne({ sku: updateData.sku.toUpperCase(), _id: { $ne: id } });
            if (existingSKU) return ResponseHelper.error(res, 'SKU đã tồn tại', 400);
        }

        // Xử lý stock update nếu có
        if (updateData.stock) {
            if (typeof updateData.stock === 'object') {
                product.stock = {
                    ...product.stock,
                    ...updateData.stock
                };
            }
            delete updateData.stock; // Xóa khỏi updateData để không bị assign lại
        }

        Object.assign(product, updateData);
        await product.save();
        await product.populate([
            { path: 'category', select: 'name slug' },
            { path: 'subcategory', select: 'name slug' },
            { path: 'createdBy', select: 'username firstName lastName' }
        ]);
        if (updateData.category) {
            Category.updateProductCount(updateData.category).catch(() => { });
            if (product.category && product.category.toString() !== updateData.category) {
                Category.updateProductCount(product.category).catch(() => { });
            }
        }
        return ResponseHelper.success(res, product, 'Cập nhật sản phẩm thành công');
    } catch (error) {
        console.error('Error in updateProduct:', error);
        if (error.code === 11000) {
            if (error.keyPattern.sku) return ResponseHelper.error(res, 'SKU đã tồn tại', 400);
            if (error.keyPattern.slug) return ResponseHelper.error(res, 'Slug đã tồn tại', 400);
        }
        return ResponseHelper.serverError(res, 'Lỗi khi cập nhật sản phẩm');
    }
};

// Xóa mềm sản phẩm (đưa vào Thùng rác)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Delete product request id =', id);
        const product = await Product.findById(id);
        if (!product) {
            console.warn('⚠️ Delete product: not found', id);
            return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');
        }

        // Soft delete: isActive=false
        product.isActive = false;
        await product.save();
        const categoryId = product.category;
        if (categoryId) Category.updateProductCount(categoryId).catch(() => { });
        return ResponseHelper.success(res, { id, isActive: product.isActive }, 'Đã chuyển sản phẩm vào Thùng rác');
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        if (error.name === 'CastError') {
            return ResponseHelper.error(res, 'ID sản phẩm không hợp lệ', 400);
        }
        return ResponseHelper.serverError(res, 'Lỗi khi xóa sản phẩm');
    }
};

// Cập nhật kho
const updateProductStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, operation = 'set', lowStockThreshold, trackStock } = req.body;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');

        let newQuantity = product.stock.quantity;
        switch (operation) {
            case 'set': newQuantity = Math.max(0, parseInt(quantity) || 0); break;
            case 'add': newQuantity = Math.max(0, product.stock.quantity + (parseInt(quantity) || 0)); break;
            case 'subtract': newQuantity = Math.max(0, product.stock.quantity - (parseInt(quantity) || 0)); break;
            default: return ResponseHelper.error(res, 'Operation không hợp lệ (set, add, subtract)', 400);
        }

        product.stock.quantity = newQuantity;
        if (lowStockThreshold !== undefined) product.stock.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold) || 0);
        if (trackStock !== undefined) product.stock.trackStock = Boolean(trackStock);
        await product.save();

        return ResponseHelper.success(res, {
            product: {
                id: product._id,
                name: product.name,
                sku: product.sku,
                stock: product.stock,
                isInStock: product.isInStock,
                isLowStock: product.isLowStock
            }
        }, 'Cập nhật kho hàng thành công');
    } catch (error) {
        console.error('Error in updateProductStock:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi cập nhật kho hàng');
    }
};

// Bật/tắt trạng thái hoạt động
const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');
        product.isActive = !product.isActive;
        await product.save();
        return ResponseHelper.success(res, { id: product._id, name: product.name, sku: product.sku, isActive: product.isActive }, `${product.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} sản phẩm thành công`);
    } catch (error) {
        console.error('Error in toggleProductStatus:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi thay đổi trạng thái sản phẩm');
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductStock,
    toggleProductStatus
};


