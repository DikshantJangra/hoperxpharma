const express = require('express');
const router = express.Router();
const scanController = require('../../controllers/scan/scanController');
const { authenticate } = require('../../middlewares/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/scan/enroll
 * @desc    Enroll barcode for a batch (during GRN)
 * @access  Private (requires INVENTORY_WRITE permission)
 */
router.post('/enroll', scanController.enrollBarcode);

/**
 * @route   POST /api/v1/scan/qr/:batchId
 * @desc    Generate internal QR code for batch
 * @access  Private
 */
router.post('/qr/:batchId', scanController.generateQR);

/**
 * @route   POST /api/v1/scan/process
 * @desc    Process scanned barcode (POS workflow)
 * @access  Private
 */
router.post('/process', scanController.processScan);

/**
 * @route   GET /api/v1/scan/verify/:barcode
 * @desc    Verify barcode validity
 * @access  Private
 */
router.get('/verify/:barcode', scanController.verifyBarcode);

/**
 * @route   GET /api/v1/scan/history
 * @desc    Get scan history for employee
 * @access  Private
 */
router.get('/history', scanController.getScanHistory);

/**
 * @route   POST /api/v1/scan/bulk-lookup
 * @desc    Bulk barcode lookup
 * @access  Private
 */
router.post('/bulk-lookup', scanController.bulkLookup);

module.exports = router;
