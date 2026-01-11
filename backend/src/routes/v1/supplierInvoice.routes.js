const express = require('express');
const router = express.Router();
const supplierInvoiceController = require('../../controllers/invoices/supplierInvoiceController');
const { authenticate } = require('../../middlewares/auth');
const { requirePermission } = require('../../middlewares/rbac');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/supplier-invoices/eligible-items
 * @desc    Get uninvoiced GRN items for compilation
 * @access  Private (requires po.read)
 * @query   supplierId, storeId, periodStart, periodEnd
 */
router.get(
    '/eligible-items',
    requirePermission('po.read'),
    supplierInvoiceController.getEligibleItems
);

/**
 * @route   GET /api/v1/supplier-invoices
 * @desc    Get all supplier invoices with filters
 * @access  Private (requires po.read)
 * @query   storeId, supplierId, status, periodStart, periodEnd, limit, offset
 */
router.get(
    '/',
    requirePermission('po.read'),
    supplierInvoiceController.getInvoices
);

/**
 * @route   GET /api/v1/supplier-invoices/:id/pdf
 * @desc    Download invoice as PDF
 * @access  Private (requires po.read)
 */
router.get(
    '/:id/pdf',
    requirePermission('po.read'),
    supplierInvoiceController.downloadInvoicePdf
);

/**
 * @route   GET /api/v1/supplier-invoices/:id
 * @desc    Get single invoice by ID with full details
 * @access  Private (requires po.read)
 */
router.get(
    '/:id',
    requirePermission('po.read'),
    supplierInvoiceController.getInvoiceById
);

/**
 * @route   POST /api/v1/supplier-invoices/draft
 * @desc    Create draft invoice from selected items
 * @access  Private (requires po.create)
 * @body    supplierId, storeId, periodStart, periodEnd, selectedGrnItemIds
 */
router.post(
    '/draft',
    requirePermission('po.create'),
    supplierInvoiceController.createDraftInvoice
);

/**
 * @route   PATCH /api/v1/supplier-invoices/:id
 * @desc    Update draft invoice metadata
 * @access  Private (requires po.update)
 * @body    notes, supplierInvoiceNo, supplierInvoiceDate
 */
router.patch(
    '/:id',
    requirePermission('po.update'),
    supplierInvoiceController.updateDraftInvoice
);

/**
 * @route   DELETE /api/v1/supplier-invoices/:id
 * @desc    Delete draft invoice
 * @access  Private (requires po.delete)
 */
router.delete(
    '/:id',
    requirePermission('po.delete'),
    supplierInvoiceController.deleteDraftInvoice
);

/**
 * @route   POST /api/v1/supplier-invoices/:id/confirm
 * @desc    Confirm draft invoice (lock and generate final number)
 * @access  Private (requires po.approve)
 */
router.post(
    '/:id/confirm',
    requirePermission('po.approve'),
    supplierInvoiceController.confirmInvoice
);

/**
 * @route   POST /api/v1/supplier-invoices/:id/payments
 * @desc    Record payment against invoice
 * @access  Private (requires po.payment)
 * @body    amount, paymentDate, paymentMethod, referenceNumber, notes
 */
router.post(
    '/:id/payments',
    requirePermission('po.payment'),
    supplierInvoiceController.recordPayment
);

module.exports = router;
