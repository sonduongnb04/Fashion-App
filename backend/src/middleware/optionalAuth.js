// Optional auth middleware: attach req.user if token is present, otherwise continue
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) return next();

        const token = authHeader.replace('Bearer ', '');
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.userId) return next();

        const user = await User.findById(decoded.userId).select('-password');
        if (!user || user.isActive === false) return next();

        req.user = { ...user.toObject(), id: user._id.toString() };
        return next();
    } catch (e) {
        // Ignore token errors for optional auth
        return next();
    }
}


