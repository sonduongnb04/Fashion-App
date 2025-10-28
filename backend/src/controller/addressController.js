// Quản lý địa chỉ giao hàng
const Response = require('../utils/responseHelper');
const Address = require('../models/Address');

// Lấy danh sách địa chỉ của user hiện tại
const list = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return Response.unauthorized(res);
        const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, updatedAt: -1 });
        return Response.success(res, addresses, 'Danh sách địa chỉ');
    } catch (error) {
        console.error('Address list error:', error);
        return Response.serverError(res);
    }
};

// Tạo địa chỉ mới
const create = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return Response.unauthorized(res);
        const data = { ...req.body, user: userId };

        // Nếu chọn mặc định thì bỏ mặc định của các địa chỉ khác
        if (data.isDefault) {
            await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
        }
        const address = await Address.create(data);
        return Response.created(res, address, 'Đã tạo địa chỉ');
    } catch (error) {
        console.error('Address create error:', error);
        return Response.serverError(res);
    }
};

// Cập nhật địa chỉ
const update = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return Response.unauthorized(res);
        const { id } = req.params;
        const data = req.body;
        const address = await Address.findOne({ _id: id, user: userId });
        if (!address) return Response.notFound(res, 'Không tìm thấy địa chỉ');
        Object.assign(address, data);
        if (data.isDefault === true) {
            await Address.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
        }
        await address.save();
        return Response.success(res, address, 'Đã cập nhật địa chỉ');
    } catch (error) {
        console.error('Address update error:', error);
        return Response.serverError(res);
    }
};

// Xóa địa chỉ
const remove = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return Response.unauthorized(res);
        const { id } = req.params;
        const address = await Address.findOneAndDelete({ _id: id, user: userId });
        if (!address) return Response.notFound(res, 'Không tìm thấy địa chỉ');
        return Response.noContent(res);
    } catch (error) {
        console.error('Address delete error:', error);
        return Response.serverError(res);
    }
};

// Đặt địa chỉ mặc định
const setDefault = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return Response.unauthorized(res);
        const { id } = req.params;
        const address = await Address.findOne({ _id: id, user: userId });
        if (!address) return Response.notFound(res, 'Không tìm thấy địa chỉ');
        await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
        address.isDefault = true;
        await address.save();
        return Response.success(res, address, 'Đã đặt làm địa chỉ mặc định');
    } catch (error) {
        console.error('Address setDefault error:', error);
        return Response.serverError(res);
    }
};

module.exports = { list, create, update, remove, setDefault };


