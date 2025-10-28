// SCRUM-9: Controller upload ảnh sản phẩm (BASIC ONLY)
const Product = require('../models/Product');
const ResponseHelper = require('../utils/responseHelper');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');
const { processImage } = require('../utils/imageProcessor');
const fs = require('fs').promises;

// Lấy danh sách ảnh của sản phẩm
const getProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).select('name images');
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');

        const images = product.images.map(img => ({
            id: img._id,
            url: img.url,
            alt: img.alt,
            isMain: img.isMain,
            publicId: img.publicId
        }));

        return ResponseHelper.success(res, {
            productId: product._id,
            productName: product.name,
            images,
            totalImages: images.length
        }, 'Lấy danh sách ảnh sản phẩm thành công');
    } catch (error) {
        console.error('Error in getProductImages:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi lấy danh sách ảnh sản phẩm');
    }
};

// Upload nhiều ảnh cho sản phẩm (cơ bản)
const uploadProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { alts = [], setMainImage = false } = req.body;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');
        if (!req.files || req.files.length === 0) {
            return ResponseHelper.error(res, 'Vui lòng chọn ít nhất một ảnh để upload', 400);
        }

        const uploadedImages = [];
        const errors = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const altText = Array.isArray(alts) ? alts[i] : alts || product.name;
            try {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.mimetype)) {
                    errors.push(`File ${file.originalname}: Định dạng không hỗ trợ`);
                    continue;
                }
                if (file.size > 5 * 1024 * 1024) {
                    errors.push(`File ${file.originalname}: Kích thước quá lớn (max 5MB)`);
                    continue;
                }

                const processedPath = await processImage(file.path, { maxWidth: 1200, quality: 85, format: 'jpeg' });

                const uploadResult = await uploadToCloudinary(processedPath, 'products', {
                    folder: `products/${product._id}`,
                    transformation: [
                        { width: 1200, height: 1200, crop: 'limit' },
                        { quality: 'auto:good' },
                        { format: 'auto' }
                    ]
                });

                uploadedImages.push({
                    url: uploadResult.url,
                    alt: altText,
                    isMain: setMainImage === 'true' && i === 0 && product.images.length === 0,
                    publicId: uploadResult.public_id
                });

                try { await fs.unlink(processedPath); } catch (_) { }
            } catch (fileError) {
                console.error(`Error processing file ${file.originalname}:`, fileError);
                errors.push(`File ${file.originalname}: Lỗi xử lý ảnh`);
            }
        }

        if (uploadedImages.length === 0) {
            return ResponseHelper.error(res, 'Không có ảnh nào được upload thành công', 400);
        }

        if (setMainImage === 'true' && uploadedImages[0]) {
            product.images.forEach(img => { img.isMain = false; });
            uploadedImages[0].isMain = true;
        }

        product.images.push(...uploadedImages);
        await product.save();

        const response = {
            productId: product._id,
            uploadedImages: uploadedImages.length,
            totalImages: product.images.length,
            images: uploadedImages
        };
        if (errors.length > 0) response.warnings = errors;

        return ResponseHelper.success(res, response, `Upload thành công ${uploadedImages.length}/${req.files.length} ảnh`);
    } catch (error) {
        console.error('Error in uploadProductImages:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi upload ảnh sản phẩm');
    }
};

// Cập nhật thông tin ảnh sản phẩm (cơ bản)
const updateProductImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;
        const { alt, isMain } = req.body;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');

        const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
        if (imageIndex === -1) return ResponseHelper.notFound(res, 'Không tìm thấy ảnh');

        if (alt !== undefined) product.images[imageIndex].alt = alt;
        if (isMain === true) {
            product.images.forEach((img, index) => { img.isMain = index === imageIndex; });
        } else if (isMain === false) {
            product.images[imageIndex].isMain = false;
        }

        await product.save();
        return ResponseHelper.success(res, product.images[imageIndex], 'Cập nhật thông tin ảnh thành công');
    } catch (error) {
        console.error('Error in updateProductImage:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi cập nhật thông tin ảnh');
    }
};

// Xóa ảnh sản phẩm
const deleteProductImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;
        const product = await Product.findById(id);
        if (!product) return ResponseHelper.notFound(res, 'Không tìm thấy sản phẩm');

        const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
        if (imageIndex === -1) return ResponseHelper.notFound(res, 'Không tìm thấy ảnh');

        const imageToDelete = product.images[imageIndex];
        if (imageToDelete.publicId) {
            try { await deleteFromCloudinary(imageToDelete.publicId); } catch (e) { console.error('Cloudinary delete error:', e); }
        }

        product.images.splice(imageIndex, 1);
        if (imageToDelete.isMain && product.images.length > 0) product.images[0].isMain = true;
        await product.save();

        return ResponseHelper.success(res, { deletedImageId: imageId, remainingImages: product.images.length }, 'Xóa ảnh sản phẩm thành công');
    } catch (error) {
        console.error('Error in deleteProductImage:', error);
        return ResponseHelper.serverError(res, 'Lỗi khi xóa ảnh sản phẩm');
    }
};

module.exports = {
    getProductImages,
    uploadProductImages,
    updateProductImage,
    deleteProductImage
};


