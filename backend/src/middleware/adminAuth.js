// Middleware phân quyền admin
const adminAuth = (req, res, next) => {
    try {
        // Kiểm tra xem người dùng có tồn tại không (nên được thiết lập bởi auth middleware)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Từ chối truy cập. Yêu cầu xác thực.'
            });
        }

        // Kiểm tra xem người dùng có phải admin không
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Từ chối truy cập. Yêu cầu quyền admin.'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};

module.exports = adminAuth;
