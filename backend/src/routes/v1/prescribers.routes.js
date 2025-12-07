const express = require('express');
const router = express.Router();
const prescriberController = require('../../controllers/prescriptions/prescriberController');
const { authenticate } = require('../../middlewares/auth');

// Protect all routes
router.use(authenticate);

router.get('/', prescriberController.getPrescribers);
router.post('/', prescriberController.createPrescriber);

module.exports = router;
