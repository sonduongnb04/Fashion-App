// Model danh mục sản phẩm
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên danh mục là bắt buộc'],
        unique: true,
        trim: true,
        maxlength: [100, 'Tên danh mục không được vượt quá 100 ký tự']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được vượt quá 500 ký tự']
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    level: {
        type: Number,
        default: 0
    },
    image: {
        url: String,
        alt: String,
        publicId: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    productCount: {
        type: Number,
        default: 0
    },
    seoData: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Tự động cập nhật level dựa trên parentCategory và tạo slug
categorySchema.pre('save', async function (next) {
    if (this.isModified('parentCategory')) {
        if (!this.parentCategory) {
            this.level = 0;
        } else {
            const parent = await this.constructor.findById(this.parentCategory);
            if (parent) {
                this.level = parent.level + 1;
            }
        }
    }

    // Tạo slug nếu chưa có
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    next();
});

// Virtual để lấy danh mục con
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentCategory'
});

// Virtual để lấy danh mục cha
categorySchema.virtual('parent', {
    ref: 'Category',
    localField: 'parentCategory',
    foreignField: '_id',
    justOne: true
});

// Phương thức tĩnh để cập nhật số lượng sản phẩm
categorySchema.statics.updateProductCount = async function (categoryId) {
    const Product = mongoose.model('Product');
    const count = await Product.countDocuments({ category: categoryId, isActive: true });
    return this.findByIdAndUpdate(
        categoryId,
        { productCount: count },
        { new: true }
    );
};

// Phương thức tĩnh để lấy tất cả danh mục con (bao gồm cả cháu, chắt...)
categorySchema.statics.getAllSubcategories = async function (categoryId) {
    const result = [];
    const queue = [categoryId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const subcategories = await this.find({ parentCategory: currentId });

        for (const subcat of subcategories) {
            result.push(subcat);
            queue.push(subcat._id);
        }
    }

    return result;
};

// Phương thức tĩnh để lấy đường dẫn đầy đủ của danh mục
categorySchema.statics.getCategoryPath = async function (categoryId) {
    const path = [];
    let currentId = categoryId;

    while (currentId) {
        const category = await this.findById(currentId);
        if (!category) break;

        path.unshift(category);
        currentId = category.parentCategory;
    }

    return path;
};

// Indexes
categorySchema.index({ name: 'text' });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ sortOrder: 1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;