const express = require('express');
const router = express.Router();

const categoryCtrl = require('../controller/categoryManagementController');

// Public category endpoints
router.get('/', categoryCtrl.list);
router.get('/:id', categoryCtrl.detail);

module.exports = router;
