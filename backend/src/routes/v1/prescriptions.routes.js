const express = require('express');
const router = express.Router();
const prescriptionController = require('../../controllers/prescriptions/prescriptionController');
const queueController = require('../../controllers/prescriptions/queueController');
const eRxController = require('../../controllers/prescriptions/eRxController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');

const upload = require('../../middlewares/uploadR2');

// Create new prescription (supports file upload) - MUST be before router.use() middlewares
router.post('/', upload.array('files'), authenticate, requireStoreAccess, prescriptionController.createPrescription);

// All other routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

// List prescriptions (with filters)
router.get('/', prescriptionController.getPrescriptions.bind(prescriptionController));

// Queue Management
router.get('/queue', queueController.getQueue);
router.post('/queue/bulk', queueController.bulkUpdate);

// E-Prescription Integration
router.get('/erx/pending', eRxController.getPending);
router.post('/erx/import', eRxController.importScript);

// Verified prescriptions
router.get('/verified', prescriptionController.getVerifiedPrescriptions);

// Get single prescription
router.get('/:id', prescriptionController.getPrescriptionById.bind(prescriptionController));

// Delete prescription
router.delete('/:id', prescriptionController.deletePrescription);

// State transition endpoints
router.patch('/:id/stage', queueController.updateStage.bind(queueController));
router.post('/:id/verify', prescriptionController.verifyPrescription.bind(prescriptionController));
router.post('/:id/hold', prescriptionController.holdPrescription.bind(prescriptionController));

// File management
router.delete('/:id/files/:fileId', prescriptionController.deleteFile.bind(prescriptionController));

// Refill management
router.post('/:id/refills', prescriptionController.createRefill.bind(prescriptionController));

module.exports = router;
