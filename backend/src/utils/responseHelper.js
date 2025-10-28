// Tiện ích hỗ trợ response cho API responses nhất quán
class ResponseHelper {
    // Response thành công
    static success(res, data = null, message = 'Thành công', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    // Response thành công có phân trang
    static successWithPagination(res, data, pagination, message = 'Thành công', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            pagination: {
                currentPage: pagination.currentPage,
                totalPages: Math.ceil(pagination.total / pagination.limit),
                totalItems: pagination.total,
                limit: pagination.limit,
                hasNext: pagination.currentPage < Math.ceil(pagination.total / pagination.limit),
                hasPrev: pagination.currentPage > 1
            }
        });
    }

    // Response lỗi
    static error(res, message = 'Lỗi', statusCode = 400, errors = null) {
        const response = {
            success: false,
            message
        };

        if (errors) {
            response.errors = errors;
        }

        return res.status(statusCode).json(response);
    }

    // Response lỗi validation
    static validationError(res, errors, message = 'Validation thất bại') {
        return res.status(400).json({
            success: false,
            message,
            errors
        });
    }

    // Response không tìm thấy
    static notFound(res, message = 'Không tìm thấy tài nguyên') {
        return res.status(404).json({
            success: false,
            message
        });
    }

    // Response không được phép
    static unauthorized(res, message = 'Truy cập không được phép') {
        return res.status(401).json({
            success: false,
            message
        });
    }

    // Response bị cấm
    static forbidden(res, message = 'Truy cập bị cấm') {
        return res.status(403).json({
            success: false,
            message
        });
    }

    // Response lỗi server
    static serverError(res, message = 'Lỗi server nội bộ') {
        return res.status(500).json({
            success: false,
            message
        });
    }

    // Response đã tạo
    static created(res, data = null, message = 'Tạo tài nguyên thành công') {
        return res.status(201).json({
            success: true,
            message,
            data
        });
    }

    // Response không có nội dung
    static noContent(res) {
        return res.status(204).send();
    }
}

module.exports = ResponseHelper;
