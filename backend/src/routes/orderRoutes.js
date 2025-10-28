const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const orderFromCartController = require('../controller/orderFromCartController');
const orderController = require('../controller/orderController');

// Apply auth middleware to all order routes
router.use(auth);

// Create order from cart
router.post('/from-cart', orderFromCartController.createOrderFromCart);

// Orders CRUD-lite
router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.patch('/:id/status', orderController.updateStatus);
router.delete('/:id', orderController.remove);

module.exports = router;


