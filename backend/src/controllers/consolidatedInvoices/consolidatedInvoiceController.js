const asyncHandler = require('../../middlewares/asyncHandler');
const consolidatedInvoiceService = require('../../services/consolidatedInvoices/consolidatedInvoiceService');

/**
 * Get GRNs available for invoicing
 * GET /api/v1/consolidated-invoices/grns
 */
const getGRNsForInvoicing = asyncHandler(async (req, res) => {
    // Debug logging
    console.log('[Invoice] User ID:', req.user?.id, 'StoreId:', req.user?.storeId);

    // Validate authentication
    if (!req.user || !req.user.storeId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in again.'
        });
    }

    const { startDate, endDate, supplierId, status } = req.query;
    const storeId = req.storeId;

    const grns = await consolidatedInvoiceService.getGRNsForInvoicing(storeId, {
        startDate,
        endDate,
        supplierId,
        status
    });

    res.json({
        success: true,
        data: grns,
        count: grns.length,
        message: grns.length === 0 ? 'No GRNs found for the selected criteria' : 'GRNs fetched successfully'
    });
});

/**
 * Create consolidated invoice
 * POST /api/v1/consolidated-invoices
 */
const createInvoice = asyncHandler(async (req, res) => {
    const { grnIds, type, periodStart, periodEnd, notes } = req.body;
    const userId = req.user.id;
    const storeId = req.storeId;

    const invoice = await consolidatedInvoiceService.createInvoice(
        { grnIds, type, periodStart, periodEnd, notes },
        userId,
        storeId
    );

    res.status(201).json({
        success: true,
        data: invoice,
        message: 'Consolidated invoice created successfully'
    });
});

/**
 * Get invoice by ID
 * GET /api/v1/consolidated-invoices/:id
 */
const getInvoiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const storeId = req.storeId;

    const invoice = await consolidatedInvoiceService.getInvoiceById(id, storeId);

    res.json({
        success: true,
        data: invoice,
        message: 'Invoice fetched successfully'
    });
});

/**
 * List all consolidated invoices
 * GET /api/v1/consolidated-invoices
 */
const listInvoices = asyncHandler(async (req, res) => {
    // Validate authentication
    if (!req.user || !req.user.storeId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const { page, limit, status, supplierId, startDate, endDate, search } = req.query;
    const storeId = req.storeId;

    const result = await consolidatedInvoiceService.listInvoices(storeId, {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        status,
        supplierId,
        startDate,
        endDate,
        search
    });

    res.json({
        success: true,
        ...result,
        message: 'Invoices fetched successfully'
    });
});

/**
 * Update invoice status
 * PATCH /api/v1/consolidated-invoices/:id/status
 */
const updateInvoiceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const storeId = req.storeId;

    const invoice = await consolidatedInvoiceService.updateInvoiceStatus(id, storeId, status);

    res.json({
        success: true,
        data: invoice,
        message: 'Invoice status updated successfully'
    });
});

/**
 * Finalize invoice
 * POST /api/v1/consolidated-invoices/:id/finalize
 */
const finalizeInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const storeId = req.storeId;

    const invoice = await consolidatedInvoiceService.finalizeInvoice(id, storeId);

    res.json({
        success: true,
        data: invoice,
        message: 'Invoice finalized successfully'
    });
});

/**
 * Delete invoice
 * DELETE /api/v1/consolidated-invoices/:id
 */
const deleteInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const storeId = req.storeId;

    await consolidatedInvoiceService.deleteInvoice(id, storeId);

    res.json({
        success: true,
        message: 'Invoice deleted successfully'
    });
});

module.exports = {
    getGRNsForInvoicing,
    createInvoice,
    getInvoiceById,
    listInvoices,
    updateInvoiceStatus,
    finalizeInvoice,
    deleteInvoice
};
