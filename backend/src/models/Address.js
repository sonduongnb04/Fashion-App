const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
    country: { type: String, default: 'VN' },
    postalCode: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
}, { timestamps: true });

addressSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model('Address', addressSchema);


