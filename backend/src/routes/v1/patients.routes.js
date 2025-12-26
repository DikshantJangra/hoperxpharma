const express = require('express');
const patientController = require('../../controllers/patients/patientController');
const patientRelationController = require('../../controllers/patients/patientRelationController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess, requirePharmacist } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const auditLogger = require('../../middlewares/auditLogger');
const {
    patientCreateSchema,
    patientUpdateSchema,
    consentCreateSchema,
    insuranceCreateSchema,
    patientQuerySchema,
} = require('../../validators/patient.validator');

const router = express.Router();

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

/**
 * Patient routes
 * IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)
 */
router.get('/search', patientController.searchPatients);
router.get('/', validate(patientQuerySchema, 'query'), patientController.getPatients);
router.get('/stats', patientController.getPatientStats);
router.get('/debtors', patientController.getDebtors);

/**
 * Refills routes (MUST be before /:id to avoid conflict)
 */
router.get('/refills', patientController.getRefillsDue);

/**
 * All consents route (MUST be before /:id to avoid conflict)
 */
router.get('/consents/all', patientController.getAllConsents);

/**
 * Consent routes
 */
router.post('/consents', validate(consentCreateSchema), patientController.createConsent);
router.put('/consents/:id/withdraw', patientController.withdrawConsent);

/**
 * Insurance routes
 */
router.post('/insurance', validate(insuranceCreateSchema), patientController.createInsurance);
router.put('/insurance/:id', patientController.updateInsurance);

/**
 * Patient-specific routes (parameterized - MUST come after specific routes)
 */
router.get('/:id', patientController.getPatientById);
router.put('/:id', requirePharmacist, validate(patientUpdateSchema), auditLogger.logActivity('PATIENT_UPDATED', 'patient'), patientController.updatePatient);
router.delete('/:id', requirePharmacist, auditLogger.logActivity('PATIENT_DELETED', 'patient'), patientController.deletePatient);
router.get('/:id/history', patientController.getPatientHistory);
router.get('/:id/consents', patientController.getPatientConsents);
router.post('/:id/refills', requirePharmacist, patientController.processRefill);
router.get('/:id/adherence', patientController.getAdherence);
router.post('/:id/adherence', patientController.recordAdherence);
router.get('/:id/ledger', patientController.getLedger);
router.get('/:id/invoices/unpaid', patientController.getUnpaidInvoices);
router.post('/:id/sync-balance', patientController.syncBalance);
router.post('/:id/payments', requirePharmacist, auditLogger.logActivity('CUSTOMER_PAYMENT', 'customer_ledger'), patientController.processPayment);

/**
 * Patient Relation Routes
 */
router.post('/:id/relations', patientRelationController.addRelation);
router.get('/:id/relations', patientRelationController.getRelations);
router.delete('/:id/relations/:relatedPatientId', patientRelationController.removeRelation);

// Create patient (after specific routes)
router.post('/', validate(patientCreateSchema), auditLogger.logActivity('PATIENT_CREATED', 'patient'), patientController.createPatient);

module.exports = router;
