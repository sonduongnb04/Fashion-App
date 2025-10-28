// Order model - Lưu đơn hàng vào MongoDB
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    productId: {
        type: String
    },
    name: String,
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    items: {
        type: [orderItemSchema],
        default: []
    },
    amounts: {
        subtotal: { type: Number, required: true, min: 0 },
        tax: { type: Number, required: true, min: 0 },
        shipping: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 }
    },
    status: {
        type: String,
        enum: ['created', 'paid', 'processing', 'shipped', 'completed', 'cancelled'],
        default: 'created'
    },
    notes: String,
    meta: {},
}, { timestamps: true });

orderSchema.pre('save', function (next) {
    if (!this.code) {
        const ts = Date.now().toString().slice(-8);
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.code = `ORD-${ts}-${rand}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);


