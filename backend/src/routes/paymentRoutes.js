const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentCtrl = require('../controller/paymentController');

router.use(auth);

router.post('/initiate', paymentCtrl.initiate);
router.post('/confirm', paymentCtrl.confirm);
router.get('/:id/status', paymentCtrl.getStatus);

module.exports = router;


