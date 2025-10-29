// Product model - Schema sản phẩm
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên sản phẩm không được vượt quá 200 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả ngắn không được vượt quá 500 ký tự']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    sku: {
        type: String,
        unique: true,
        required: [true, 'SKU là bắt buộc'],
        trim: true,
        uppercase: true
    },
    price: {
        type: Number,
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Giá gốc không được âm']
    },
    discount: {
        type: Number,
        min: [0, 'Giảm giá không được âm'],
        max: [100, 'Giảm giá không được vượt quá 100%'],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Danh mục là bắt buộc']
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            default: ''
        },
        isMain: {
            type: Boolean,
            default: false
        },
        publicId: String, // Cloudinary public_id
        sizes: {
            thumbnail: String,
            small: String,
            medium: String,
            large: String
        }
    }],
    stock: {
        quantity: {
            type: Number,
            required: [true, 'Số lượng tồn kho là bắt buộc'],
            min: [0, 'Số lượng không được âm'],
            default: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 5
        },
        trackStock: {
            type: Boolean,
            default: true
        }
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        weight: Number,
        unit: {
            type: String,
            enum: ['cm', 'inch', 'mm'],
            default: 'cm'
        }
    },
    attributes: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        }
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isDigital: {
        type: Boolean,
        default: false
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        },
        reviews: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    // Variants and options
    colors: [{
        type: String,
        trim: true
    }],
    sizes: [{
        type: String,
        trim: true
    }],
    variants: [{
        color: String,
        size: String,
        sku: String,
        stock: {
            type: Number,
            default: 0
        },
        price: Number,
        images: [String]
    }],
    seoData: {
        metaTitle: String,
        metaDescription: String,
        metaKeywords: [String]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Tạo slug và SKU trước bước validate để không bị lỗi required
productSchema.pre('validate', async function (next) {
    // SKU bắt buộc: tự sinh nếu chưa có khi tạo mới
    if (!this.sku) {
        const timestamp = Date.now().toString().slice(-6);
        const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
        this.sku = `PRD${timestamp}${randomStr}`;
    }

    // Cập nhật slug theo name
    if (this.isModified('name') || !this.slug) {
        const base = (this.name || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        let candidate = base || 'san-pham';
        let suffix = 0;

        // Đảm bảo slug duy nhất (bỏ qua chính bản ghi hiện tại nếu đang update)
        // Lưu ý: dùng exists để nhanh hơn
        // eslint-disable-next-line no-constant-condition
        while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
            suffix += 1;
            candidate = `${base}-${suffix}`;
        }
        this.slug = candidate;
    }
    next();
});

// Virtual cho giá sau giảm
productSchema.virtual('discountPrice').get(function () {
    if (this.discount > 0) {
        return this.price * (1 - this.discount / 100);
    }
    return this.price;
});

// Virtual kiểm tra còn hàng
productSchema.virtual('isInStock').get(function () {
    return this.stock.quantity > 0;
});

// Virtual kiểm tra sắp hết hàng
productSchema.virtual('isLowStock').get(function () {
    return this.stock.trackStock && this.stock.quantity <= this.stock.lowStockThreshold;
});

// Virtual cho ảnh chính
productSchema.virtual('mainImage').get(function () {
    const mainImg = this.images.find(img => img.isMain);
    return mainImg || this.images[0] || null;
});

// Indexes cho performance và search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ sales: -1 });
productSchema.index({ views: -1 });
productSchema.index({ sku: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// Enable virtuals trong JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);