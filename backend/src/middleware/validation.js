// Middleware validation sử dụng express-validator
const { body } = require('express-validator');

// Validation đăng ký người dùng (đơn giản hóa cho demo)
const registerValidation = [
    // ✅ FIX: Check 'name' field thay vì 'username' vì frontend gửi 'name'
    body('name')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Họ tên phải có ít nhất 3 ký tự')
        .notEmpty()
        .withMessage('Họ tên là bắt buộc'),

    body('email')
        .isEmail()
        .withMessage('Vui lòng cung cấp email hợp lệ')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),

    body('firstName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Họ không được vượt quá 50 ký tự'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Tên không được vượt quá 50 ký tự'),

    body('phoneNumber')
        .optional()
        .isMobilePhone()
        .withMessage('Vui lòng cung cấp số điện thoại hợp lệ')
];

// Validation đăng nhập người dùng (cho phép email hoặc username)
const loginValidation = [
    body('email')
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage('Vui lòng cung cấp email hợp lệ')
        .normalizeEmail(),
    body('username')
        .optional({ checkFalsy: true })
        .isLength({ min: 3 })
        .withMessage('Username phải có ít nhất 3 ký tự'),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu là bắt buộc'),
    // Ít nhất một trong email/username phải có
    body('email').custom((value, { req }) => {
        if (!value && !req.body.username) {
            throw new Error('Cần cung cấp email hoặc username');
        }
        return true;
    })
];

// Validation sản phẩm
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Tên sản phẩm phải có từ 2 đến 200 ký tự'),

    body('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Mô tả sản phẩm phải có từ 10 đến 2000 ký tự'),

    body('price')
        .isFloat({ min: 0 })
        .withMessage('Giá sản phẩm phải là số dương'),

    body('category')
        .isMongoId()
        .withMessage('ID danh mục không hợp lệ'),

    body('subcategory')
        .optional()
        .isMongoId()
        .withMessage('ID danh mục con không hợp lệ'),

    body('sku')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('SKU phải có từ 3 đến 50 ký tự'),

    body('stock.quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số lượng tồn kho phải là số nguyên không âm'),

    body('stock.lowStockThreshold')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Ngưỡng cảnh báo tồn kho phải là số nguyên không âm')
];

// Validation danh mục
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Tên danh mục phải có từ 2 đến 100 ký tự'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả danh mục không được vượt quá 500 ký tự'),

    body('parentCategory')
        .optional()
        .isMongoId()
        .withMessage('ID danh mục cha không hợp lệ'),

    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Thứ tự sắp xếp phải là số nguyên không âm')
];

module.exports = {
    registerValidation,
    loginValidation,
    productValidation,
    categoryValidation
};
