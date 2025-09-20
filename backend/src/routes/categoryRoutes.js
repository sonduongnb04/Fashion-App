const express = require('express');
const router = express.Router();

const categoryManagementController = require('../controllers/categoryManagementController');

// Public endpoints
router.get('/', categoryManagementController.list);
router.get('/:id', categoryManagementController.detail);

// Management endpoints (e.g., admin)
router.post('/', categoryManagementController.create);
router.put('/:id', categoryManagementController.update);
router.delete('/:id', categoryManagementController.remove);

module.exports = router;



