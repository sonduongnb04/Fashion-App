// Tính tổng giỏ hàng
const Response = require('../utils/responseHelper');

const getTotals = (req, res) => {
    const cart = (req.session && req.session.cart) || { items: [] };
    const summary = cart.items.reduce((acc, item) => {
        const lineTotal = (item.price || 0) * (item.quantity || 0);
        acc.subtotal += lineTotal;
        acc.items += item.quantity || 0;
        return acc;
    }, { subtotal: 0, items: 0 });

    const shipping = summary.subtotal > 0 ? 0 : 0;
    const tax = Math.round(summary.subtotal * 0.1);
    const total = summary.subtotal + tax + shipping;

    return Response.success(res, {
        itemsCount: summary.items,
        subtotal: summary.subtotal,
        tax,
        shipping,
        total
    }, 'Tổng giỏ hàng');
};

module.exports = { getTotals };


