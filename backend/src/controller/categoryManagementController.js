// Bộ điều khiển quản lý danh mục sản phẩm 
const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const ResponseHelper = require('../utils/responseHelper');
const { QueryHelper } = require('../utils/queryHelpers');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

/**
 * @mô_tả  Lấy tất cả danh mục với phân trang và lọc
 * @route  GET /api/categories
 * @truy_cập Công khai
 */
const list = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            level,
            parentCategory,
            isActive,
            sort = 'sortOrder'
        } = req.query;

        // Xây dựng bộ lọc
        let filter = {};
        // Chỉ filter isActive nếu được truyền vào
        if (isActive !== undefined && isActive !== 'all') {
            filter.isActive = isActive === 'true';
        }
        if (level !== undefined) {
            filter.level = parseInt(level);
        }
        if (parentCategory) {
            filter.parentCategory = parentCategory === 'null' ? null : parentCategory;
        }

        console.log('Category list filter:', filter);

        // Truy vấn kèm phân trang
        const queryHelper = new QueryHelper(Category.find(filter), req.query);
        const categories = await queryHelper
            .sort()
            .paginate()
            .populate('parentCategory', 'name slug')
            .populate('subcategories')
            .query;

        // Lấy tổng số bản ghi
        const total = await Category.countDocuments(filter);

        console.log(`Found ${categories.length} categories (total: ${total})`);

        ResponseHelper.successWithPagination(res, categories, {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            total
        }, 'Lấy danh sách danh mục thành công');

    } catch (error) {
        console.error('Error in getAllCategories:', error);
        ResponseHelper.serverError(res, 'Lỗi khi lấy danh sách danh mục');
    }
};


/**
 * @mô_tả  Lấy danh mục theo ID
 * @route  GET /api/categories/:id
 * @truy_cập Công khai
 */
const detail = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id)
            .populate('parentCategory', 'name slug')
            .populate('subcategories')
            .populate('parent');

        if (!category) {
            return ResponseHelper.notFound(res, 'Không tìm thấy danh mục');
        }

        // Cập nhật số lượng sản phẩm thuộc danh mục này (nếu có)
        await Category.updateProductCount(category._id);

        ResponseHelper.success(res, category, 'Lấy thông tin danh mục thành công');
    } catch (error) {
        console.error('Error in getCategoryById:', error);
        if (error.name === 'CastError') {
            return ResponseHelper.notFound(res, 'ID danh mục không hợp lệ');
        }
        ResponseHelper.serverError(res, 'Lỗi khi lấy thông tin danh mục');
    }
};

/**
 * @mô_tả  Tạo danh mục mới
 * @route  POST /api/categories
 * @truy_cập Riêng tư (chỉ Admin)
 */
const create = async (req, res) => {
    try {
        // Kiểm tra lỗi hợp lệ đầu vào
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return ResponseHelper.validationError(res, errors.array());
        }

        const { name, description, parentCategory, sortOrder, seoData } = req.body;

        // Kiểm tra tên danh mục đã tồn tại
        const existingCategory = await Category.findOne({
            name: new RegExp(`^${name.trim()}$`, 'i')
        });
        if (existingCategory) {
            return ResponseHelper.error(res, 'Tên danh mục đã tồn tại', 400);
        }

        // Kiểm tra danh mục cha nếu có
        if (parentCategory) {
            const parentExists = await Category.findById(parentCategory);
            if (!parentExists) {
                return ResponseHelper.error(res, 'Danh mục cha không tồn tại', 400);
            }
        }

        // Tạo đối tượng danh mục để lưu
        const categoryData = {
            name: name.trim(),
            description: description?.trim(),
            parentCategory: parentCategory || null,
            sortOrder: sortOrder || 0,
            seoData,
            createdBy: req.user.id
        };

        // Upload ảnh nếu có
        if (req.file) {
            try {
                const uploadResult = await uploadToCloudinary(req.file.path, 'categories');
                categoryData.image = {
                    url: uploadResult.url,
                    alt: name,
                    publicId: uploadResult.public_id
                };
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return ResponseHelper.error(res, 'Lỗi khi upload ảnh danh mục', 400);
            }
        }

        const category = new Category(categoryData);
        await category.save();

        // Nạp thêm thông tin liên quan
        await category.populate('parentCategory', 'name slug');

        ResponseHelper.created(res, category, 'Tạo danh mục thành công');

    } catch (error) {
        console.error('Error in createCategory:', error);
        if (error.code === 11000) {
            return ResponseHelper.error(res, 'Tên danh mục hoặc slug đã tồn tại', 400);
        }
        ResponseHelper.serverError(res, 'Lỗi khi tạo danh mục');
    }
};

/**
 * @mô_tả  Cập nhật danh mục
 * @route  PUT /api/categories/:id
 * @truy_cập Riêng tư (chỉ Admin)
 */
const update = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return ResponseHelper.validationError(res, errors.array());
        }

        const { id } = req.params;
        const { name, description, parentCategory, sortOrder, seoData } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return ResponseHelper.notFound(res, 'Không tìm thấy danh mục');
        }

        // Kiểm tra tên trùng với danh mục khác
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                name: new RegExp(`^${name.trim()}$`, 'i'),
                _id: { $ne: id }
            });
            if (existingCategory) {
                return ResponseHelper.error(res, 'Tên danh mục đã tồn tại', 400);
            }
        }

        // Validate parent category
        if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
            if (parentCategory === id) {
                return ResponseHelper.error(res, 'Danh mục không thể là cha của chính nó', 400);
            }

            const parentExists = await Category.findById(parentCategory);
            if (!parentExists) {
                return ResponseHelper.error(res, 'Danh mục cha không tồn tại', 400);
            }

            // Kiểm tra để không tạo vòng lặp cha-con
            const allSubcategories = await Category.getAllSubcategories(id);
            const subcategoryIds = allSubcategories.map(sub => sub._id.toString());
            if (subcategoryIds.includes(parentCategory)) {
                return ResponseHelper.error(res, 'Không thể đặt danh mục con làm danh mục cha', 400);
            }
        }

        // Cập nhật các trường
        if (name) category.name = name.trim();
        if (description !== undefined) category.description = description?.trim();
        if (parentCategory !== undefined) {
            category.parentCategory = parentCategory || null;
        }
        if (sortOrder !== undefined) category.sortOrder = sortOrder;
        if (seoData) category.seoData = { ...category.seoData, ...seoData };

        // Xử lý upload ảnh nếu có
        if (req.file) {
            try {
                // Delete old image if exists
                if (category.image?.publicId) {
                    await deleteFromCloudinary(category.image.publicId);
                }

                // Upload new image
                const uploadResult = await uploadToCloudinary(req.file.path, 'categories');
                category.image = {
                    url: uploadResult.url,
                    alt: category.name,
                    publicId: uploadResult.public_id
                };
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                return ResponseHelper.error(res, 'Lỗi khi upload ảnh danh mục', 400);
            }
        }

        await category.save();
        await category.populate('parentCategory', 'name slug');

        ResponseHelper.success(res, category, 'Cập nhật danh mục thành công');

    } catch (error) {
        console.error('Error in updateCategory:', error);
        if (error.code === 11000) {
            return ResponseHelper.error(res, 'Tên danh mục hoặc slug đã tồn tại', 400);
        }
        ResponseHelper.serverError(res, 'Lỗi khi cập nhật danh mục');
    }
};

/**
 * @mô_tả  Xóa danh mục
 * @route  DELETE /api/categories/:id
 * @truy_cập Riêng tư (chỉ Admin)
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);
        if (!category) {
            return ResponseHelper.notFound(res, 'Không tìm thấy danh mục');
        }

        // Kiểm tra có sản phẩm nào đang sử dụng danh mục này không
        const productCount = await Product.countDocuments({
            $or: [
                { category: id },
                { subcategory: id }
            ]
        });

        if (productCount > 0) {
            return ResponseHelper.error(
                res,
                `Không thể xóa danh mục này vì có ${productCount} sản phẩm đang sử dụng`,
                400
            );
        }

        // Kiểm tra có danh mục con hay không
        const subcategoryCount = await Category.countDocuments({ parentCategory: id });
        if (subcategoryCount > 0) {
            return ResponseHelper.error(
                res,
                `Không thể xóa danh mục này vì có ${subcategoryCount} danh mục con`,
                400
            );
        }

        // Xóa ảnh trên Cloudinary nếu có
        if (category.image?.publicId) {
            try {
                await deleteFromCloudinary(category.image.publicId);
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error);
            }
        }

        await Category.findByIdAndDelete(id);

        ResponseHelper.success(res, null, 'Xóa danh mục thành công');

    } catch (error) {
        console.error('Error in deleteCategory:', error);
        ResponseHelper.serverError(res, 'Lỗi khi xóa danh mục');
    }
};


module.exports = {
    list,
    detail,
    create,
    update,
    remove,
};