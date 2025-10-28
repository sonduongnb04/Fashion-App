// Controller xác thực người dùng
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const ResponseHelper = require('../utils/responseHelper');

// Tạo JWT token (fallback secret cho môi trường dev)
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'dev_secret';
    return jwt.sign({ userId }, secret, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// Đăng ký người dùng
const register = async (req, res) => {
    try {
        console.log('📝 Register request body:', req.body);

        // Xử lý lỗi validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return ResponseHelper.validationError(res, errors.array());
        }

        // ✅ FIX: Lấy 'name' từ frontend (register.tsx gửi { name, email, password })
        const { name, email, password } = req.body;

        // ✅ FIX: Dùng 'name' làm 'username'
        const username = name;

        // ✅ Kiểm tra các trường bắt buộc
        if (!username || !email || !password) {
            console.log('❌ Missing required fields (name, email, or password)');
            return ResponseHelper.error(res, 'Thiếu Họ tên, email hoặc mật khẩu', 400);
        }

        // ✅ FIX: Tách 'name' thành 'firstName' và 'lastName'
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        console.log('📋 Parsed name:', { firstName, lastName, username });

        // Check existing user
        const existing = await User.findOne({
            $or: [
                { email: new RegExp(`^${email.trim()}$`, 'i') },
                { username: new RegExp(`^${username.trim()}$`, 'i') }
            ]
        });
        if (existing) {
            console.log('❌ User already exists:', existing.email);
            return ResponseHelper.error(res, 'Email hoặc Họ tên (username) đã tồn tại', 400);
        }

        // Create user
        const user = new User({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            firstName: firstName,
            lastName: lastName,
        });
        user.password = password;

        console.log('💾 Saving user to database...');
        console.log('👤 User data before save:', {
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password ? '[HASHED]' : 'NOT SET',
        });

        // ✅ Validate before saving
        const validationError = user.validateSync();
        if (validationError) {
            console.error('❌ Validation error before save:', validationError);
            return ResponseHelper.error(res, 'Validation failed: ' + Object.values(validationError.errors).map(e => e.message).join(', '), 400);
        }

        try {
            const savedUser = await user.save();
            console.log('✅ User saved successfully:', savedUser._id);
            console.log('✅ Saved user in DB:', {
                _id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
            });
        } catch (saveError) {
            console.error('❌ CRITICAL ERROR during user.save():', saveError);
            console.error('❌ Error name:', saveError.name);
            console.error('❌ Error message:', saveError.message);
            console.error('❌ Error code:', saveError.code);
            console.error('❌ Full error:', JSON.stringify(saveError, null, 2));
            throw saveError;
        }

        const token = generateToken(user._id.toString());
        const userResponse = user.toObject();
        delete userResponse.password;

        console.log('✅ Sending register response with token');
        return ResponseHelper.created(res, { token, user: userResponse }, 'Đăng ký thành công');
    } catch (error) {
        console.error('❌ Register error:', error);
        if (error.code === 11000) {
            return ResponseHelper.error(res, 'Email hoặc Họ tên (username) đã tồn tại', 400);
        }
        return ResponseHelper.serverError(res, 'Lỗi server: ' + error.message);
    }
};

// Đăng nhập người dùng
const login = async (req, res) => {
    try {
        // Xử lý lỗi validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return ResponseHelper.validationError(res, errors.array());
        }

        const { email, username, password } = req.body;
        if ((!email && !username) || !password) {
            return ResponseHelper.error(res, 'Thiếu thông tin đăng nhập', 400);
        }

        const query = email
            ? { email: new RegExp(`^${email.trim()}$`, 'i') }
            : { username: new RegExp(`^${username.trim()}$`, 'i') };
        const user = await User.findOne(query);
        if (!user) return ResponseHelper.error(res, 'Sai thông tin đăng nhập', 401);
        if (!user.isActive) return ResponseHelper.error(res, 'Tài khoản đã bị vô hiệu hóa', 403);

        const ok = await user.comparePassword(password);
        if (!ok) return ResponseHelper.error(res, 'Sai thông tin đăng nhập', 401);

        user.lastLoginAt = new Date();
        await user.save();

        const token = generateToken(user._id.toString());
        return ResponseHelper.success(res, { token, user }, 'Đăng nhập thành công');
    } catch (error) {
        return ResponseHelper.serverError(res, 'Lỗi server');
    }
};

// Lấy thông tin profile người dùng hiện tại
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return ResponseHelper.notFound(res, 'Không tìm thấy người dùng');
        return ResponseHelper.success(res, user, 'Lấy thông tin người dùng thành công');
    } catch (error) {
        return ResponseHelper.serverError(res, 'Lỗi server');
    }
};

// Cập nhật profile người dùng
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return ResponseHelper.notFound(res, 'Không tìm thấy người dùng');

        const { username, email, firstName, lastName, avatar } = req.body;

        if (username && username !== user.username) {
            const exists = await User.findOne({ username: new RegExp(`^${username.trim()}$`, 'i'), _id: { $ne: user._id } });
            if (exists) return ResponseHelper.error(res, 'Username đã tồn tại', 400);
            user.username = username.trim();
        }
        if (email && email.toLowerCase() !== user.email) {
            const exists = await User.findOne({ email: new RegExp(`^${email.trim()}$`, 'i'), _id: { $ne: user._id } });
            if (exists) return ResponseHelper.error(res, 'Email đã tồn tại', 400);
            user.email = email.trim().toLowerCase();
        }
        if (firstName !== undefined) user.firstName = firstName?.trim() || '';
        if (lastName !== undefined) user.lastName = lastName?.trim() || '';
        if (avatar && typeof avatar === 'object') {
            user.avatar = { ...user.avatar, ...avatar };
        }

        await user.save();
        return ResponseHelper.success(res, user, 'Cập nhật hồ sơ thành công');
    } catch (error) {
        return ResponseHelper.serverError(res, 'Lỗi server');
    }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return ResponseHelper.error(res, 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới', 400);
        }
        if (newPassword.length < 6) {
            return ResponseHelper.error(res, 'Mật khẩu mới phải từ 6 ký tự', 400);
        }
        const user = await User.findById(req.user.id);
        if (!user) return ResponseHelper.notFound(res, 'Không tìm thấy người dùng');
        const ok = await user.comparePassword(currentPassword);
        if (!ok) return ResponseHelper.error(res, 'Mật khẩu hiện tại không đúng', 400);
        user.password = newPassword; // setter ảo: cập nhật passwordHash từ mật khẩu mới
        await user.save();
        return ResponseHelper.success(res, null, 'Đổi mật khẩu thành công');
    } catch (error) {
        return ResponseHelper.serverError(res, 'Lỗi server');
    }
};

// Đăng xuất người dùng (JWT không trạng thái)
const logout = async (_req, res) => {
    try {
        return ResponseHelper.success(res, null, 'Đăng xuất thành công');
    } catch (error) {
        return ResponseHelper.serverError(res, 'Lỗi server');
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    logout
};
