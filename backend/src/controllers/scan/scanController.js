const scanService = require('../../services/scan/scanService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiError = require('../../utils/ApiError');

/**
 * Scan Controller - HTTP handlers for barcode/QR scanning endpoints
 */

/**
 * Enroll barcode for a batch (during GRN or manual inventory)
 */
exports.enrollBarcode = asyncHandler(async (req, res) => {
    const { barcode, batchId, barcodeType, unitType } = req.body;

    if (!barcode || !batchId) {
        throw ApiError.badRequest('Barcode and batchId are required');
    }

    const barcodeRegistry = await scanService.enrollBarcode({
        barcode,
        batchId,
        barcodeType: barcodeType || 'MANUFACTURER',
        unitType: unitType || 'STRIP'
    });

    res.status(201).json({
        success: true,
        message: 'Barcode enrolled successfully',
        data: barcodeRegistry
    });
});

/**
 * Generate internal QR code for a batch
 */
exports.generateQR = asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    const qrData = await scanService.generateInternalQR(batchId);

    res.json({
        success: true,
        message: 'QR code generated successfully',
        data: qrData
    });
});

/**
 * Process scanned barcode (main POS workflow)
 */
exports.processScan = asyncHandler(async (req, res) => {
    const { barcode } = req.body;
    const employeeId = req.user.id;
    const storeId = req.user.storeId || req.body.storeId;

    if (!barcode) {
        throw ApiError.badRequest('Barcode is required');
    }

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    const batchData = await scanService.processScan({
        barcode,
        employeeId,
        storeId,
        context: req.body.context || 'SALE'
    });

    res.json({
        success: true,
        message: 'Barcode scanned successfully',
        data: batchData
    });
});

/**
 * Verify barcode validity
 */
exports.verifyBarcode = asyncHandler(async (req, res) => {
    const { barcode } = req.params;

    const verification = await scanService.verifyBarcode(barcode);

    res.json({
        success: true,
        data: verification
    });
});

/**
 * Get scan history for employee
 */
exports.getScanHistory = asyncHandler(async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    const userId = employeeId || req.user.id;

    const history = await scanService.getEmployeeScanStats(
        userId,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
    );

    res.json({
        success: true,
        data: history
    });
});

/**
 * Bulk barcode lookup
 */
exports.bulkLookup = asyncHandler(async (req, res) => {
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
        throw ApiError.badRequest('Barcodes array is required');
    }

    if (barcodes.length > 100) {
        throw ApiError.badRequest('Maximum 100 barcodes allowed per request');
    }

    const results = await scanService.bulkLookup(barcodes);

    res.json({
        success: true,
        data: {
            total: results.length,
            found: results.filter(r => r.found).length,
            notFound: results.filter(r => !r.found).length,
            results
        }
    });
});
