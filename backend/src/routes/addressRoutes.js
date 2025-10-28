const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const addressCtrl = require('../controller/addressController');

router.use(auth);

router.get('/', addressCtrl.list);
router.post('/', addressCtrl.create);
router.put('/:id', addressCtrl.update);
router.delete('/:id', addressCtrl.remove);
router.post('/:id/set-default', addressCtrl.setDefault);

module.exports = router;


