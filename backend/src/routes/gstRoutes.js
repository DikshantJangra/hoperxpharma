const express = require('express');
const router = express.Router();
const gstController = require('../controllers/gstController');
const gstReportController = require('../controllers/gstReportController');
const { authenticate } = require('../middlewares/auth');

// All routes require authentication
router.use(authenticate);

// Tax Slabs
router.post('/tax-slabs', gstController.createTaxSlab);
router.get('/tax-slabs', gstController.getTaxSlabs);
router.get('/tax-slabs/:id', gstController.getTaxSlabById);
router.put('/tax-slabs/:id', gstController.updateTaxSlab);
router.delete('/tax-slabs/:id', gstController.deleteTaxSlab);

// HSN Codes
router.post('/hsn-codes', gstController.createHsnCode);
router.get('/hsn-codes', gstController.getHsnCodes);
router.get('/hsn-codes/:id', gstController.getHsnCodeById);
router.put('/hsn-codes/:id', gstController.updateHsnCode);
router.delete('/hsn-codes/:id', gstController.deleteHsnCode);

// Reporting & Dashboard
router.get('/dashboard', gstReportController.getDashboard);
router.get('/gstr1-summary', gstReportController.getGSTR1Summary);
router.get('/gstr3b-summary', gstReportController.getGSTR3BSummary);
router.get('/trends', gstReportController.getMonthlyTrend);

// Utilities
router.post('/seed-defaults', gstController.seedDefaults);
router.post('/validate-gstin', gstController.validateGSTIN);

module.exports = router;
