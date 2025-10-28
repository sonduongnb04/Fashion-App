// Tiện ích xử lý ảnh sử dụng Sharp (tùy chọn)
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    sharp = null;
}
const path = require('path');
const fs = require('fs').promises;

// Thay đổi kích thước và tối ưu hóa ảnh
const processImage = async (inputPath, outputPath, options = {}) => {
    const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'jpeg'
    } = options;

    try {
        if (!sharp) {
            // Fallback: nếu không có sharp, chỉ copy file sang output
            await fs.copyFile(inputPath, outputPath);
            return outputPath;
        }
        await sharp(inputPath)
            .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality })
            .toFile(outputPath);

        return outputPath;
    } catch (error) {
        throw new Error(`Xử lý ảnh thất bại: ${error.message}`);
    }
};

// Tạo nhiều kích thước cho ảnh responsive
const createResponsiveImages = async (inputPath, outputDir, filename) => {
    const sizes = [
        { suffix: '_thumb', width: 150, height: 150 },
        { suffix: '_small', width: 300, height: 300 },
        { suffix: '_medium', width: 600, height: 600 },
        { suffix: '_large', width: 1200, height: 1200 }
    ];

    const processedImages = [];
    const baseName = path.parse(filename).name;
    const ext = '.jpg';

    if (!sharp) {
        // Không tạo các kích thước khi thiếu sharp
        return processedImages;
    }

    for (const size of sizes) {
        const outputFilename = `${baseName}${size.suffix}${ext}`;
        const outputPath = path.join(outputDir, outputFilename);

        await processImage(inputPath, outputPath, {
            width: size.width,
            height: size.height,
            quality: 80
        });

        processedImages.push({
            size: size.suffix.replace('_', ''),
            filename: outputFilename,
            path: outputPath
        });
    }

    return processedImages;
};

// Xóa file
const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error(`Xóa file thất bại ${filePath}:`, error.message);
    }
};

// Lấy metadata của ảnh
const getImageMetadata = async (imagePath) => {
    try {
        if (!sharp) {
            const stat = await fs.stat(imagePath).catch(() => ({ size: 0 }));
            return { width: 0, height: 0, format: 'unknown', size: stat.size };
        }
        const metadata = await sharp(imagePath).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: metadata.size
        };
    } catch (error) {
        throw new Error(`Không thể lấy metadata của ảnh: ${error.message}`);
    }
};

module.exports = {
    processImage,
    createResponsiveImages,
    deleteFile,
    getImageMetadata
};
