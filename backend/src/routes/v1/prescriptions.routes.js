const express = require('express');
const router = express.Router();
const prescriptionController = require('../../controllers/prescriptions/prescriptionController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// List prescriptions (with filters)
router.get('/', prescriptionController.getPrescriptions.bind(prescriptionController));

// Create new prescription
router.post('/', prescriptionController.createPrescription.bind(prescriptionController));

// Get single prescription
router.get('/:id', prescriptionController.getPrescriptionById.bind(prescriptionController));

// State transition endpoints
router.post('/:id/verify', prescriptionController.verifyPrescription.bind(prescriptionController));
router.post('/:id/hold', prescriptionController.holdPrescription.bind(prescriptionController));

module.exports = router;
