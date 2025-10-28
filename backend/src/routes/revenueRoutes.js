const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const revenueCtrl = require('../controller/revenueController');

// Admin only
router.use(auth, adminAuth);

router.get('/top-customers', revenueCtrl.topCustomers);
router.get('/by-month', revenueCtrl.revenueByMonth);
router.get('/by-week', revenueCtrl.revenueByWeek);
router.get('/by-category', revenueCtrl.revenueByCategory);

module.exports = router;

