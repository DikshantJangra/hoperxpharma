const express = require('express');
const patientController = require('../../controllers/patients/patientController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess, requirePharmacist } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    patientCreateSchema,
    patientUpdateSchema,
    consentCreateSchema,
    insuranceCreateSchema,
    patientQuerySchema,
} = require('../../validators/patient.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Patient routes (require store access)
 */
router.get('/', requireStoreAccess, validate(patientQuerySchema, 'query'), patientController.getPatients);
router.get('/stats', requireStoreAccess, patientController.getPatientStats);
router.get('/:id', patientController.getPatientById);
router.post('/', requireStoreAccess, validate(patientCreateSchema), patientController.createPatient);
router.put('/:id', requirePharmacist, validate(patientUpdateSchema), patientController.updatePatient);
router.delete('/:id', requirePharmacist, patientController.deletePatient);

/**
 * Consent routes
 */
router.post('/consents', validate(consentCreateSchema), patientController.createConsent);
router.put('/consents/:id/withdraw', patientController.withdrawConsent);
router.get('/:patientId/consents', patientController.getPatientConsents);

/**
 * Insurance routes
 */
router.post('/insurance', validate(insuranceCreateSchema), patientController.createInsurance);
router.put('/insurance/:id', patientController.updateInsurance);

/**
 * History routes
 */
router.get('/:id/history', patientController.getPatientHistory);

/**
 * Refills routes
 */
router.get('/refills', requireStoreAccess, patientController.getRefillsDue);
router.post('/:id/refills', requirePharmacist, patientController.processRefill);

/**
 * Adherence routes
 */
router.get('/:id/adherence', patientController.getAdherence);
router.post('/:id/adherence', patientController.recordAdherence);

/**
 * All consents route (for consents page)
 */
router.get('/consents/all', requireStoreAccess, patientController.getAllConsents);

module.exports = router;
