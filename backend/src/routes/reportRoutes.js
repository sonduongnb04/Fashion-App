const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const reportCtrl = require('../controller/reportController.js');

// Admin only
router.use(auth, adminAuth);

router.get('/revenue', reportCtrl.revenueReport);
router.get('/top-products', reportCtrl.topProducts);

module.exports = router;


