const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    provider: { type: String, enum: ['cod', 'stripe', 'paypal', 'vnpay', 'momo'], default: 'cod' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'VND' },
    status: { type: String, enum: ['initiated', 'pending', 'authorized', 'paid', 'failed', 'cancelled', 'refunded'], default: 'initiated' },
    providerRef: { type: String },
    meta: {},
}, { timestamps: true });

paymentSchema.index({ order: 1 });

module.exports = mongoose.model('Payment', paymentSchema);


