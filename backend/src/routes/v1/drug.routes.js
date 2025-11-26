const express = require('express');
const drugController = require('../../controllers/drugs/drugController');
const { authenticate } = require('../../middlewares/auth');
const { requirePharmacist } = require('../../middlewares/rbac');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Drug search and retrieval routes
 */
router.get('/search', drugController.searchDrugs);
router.get('/', drugController.getAllDrugs);
router.get('/:id', drugController.getDrugById);

/**
 * Drug management routes (require pharmacist role)
 */
router.post('/', requirePharmacist, drugController.createDrug);
router.put('/:id', requirePharmacist, drugController.updateDrug);

/**
 * CSV import route (require pharmacist role)
 */
router.post(
    '/import-csv',
    requirePharmacist,
    drugController.upload.single('file'),
    drugController.importDrugsFromCSV
);

module.exports = router;
