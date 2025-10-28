// Middleware xử lý lỗi toàn cục
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Ghi log lỗi
    console.error(err);

    // Mongoose ObjectId không hợp lệ
    if (err.name === 'CastError') {
        const message = 'Không tìm thấy tài nguyên';
        error = { message, statusCode: 404 };
    }

    // Mongoose trùng khóa
    if (err.code === 11000) {
        const message = 'Giá trị trường đã tồn tại';
        error = { message, statusCode: 400 };
    }

    // Lỗi validation của Mongoose
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // Lỗi JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token không hợp lệ';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token đã hết hạn';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Lỗi Server'
    });
};

module.exports = errorHandler;
