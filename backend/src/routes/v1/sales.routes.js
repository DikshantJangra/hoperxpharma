const express = require('express');
const saleController = require('../../controllers/sales/saleController');
const saleDraftController = require('../../controllers/sales/saleDraftController');
const saleRefundController = require('../../controllers/sales/saleRefundController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const auditLogger = require('../../middlewares/auditLogger');
const { saleCreateSchema, saleQuerySchema } = require('../../validators/sale.validator');

const router = express.Router();

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

/**
 * IMPORTANT: Specific routes MUST come before dynamic :id routes
 * Otherwise /sales/drafts will match /sales/:id with id="drafts"
 */

/**
 * Draft routes - MUST be before /:id routes
 */
router.post('/drafts', saleDraftController.saveDraft);
router.get('/drafts', saleDraftController.getDrafts);
router.post('/drafts/cleanup', saleDraftController.cleanupExpiredDrafts);
router.get('/drafts/:id', saleDraftController.getDraftById);
router.put('/drafts/:id', saleDraftController.updateDraft);
router.post('/drafts/:id/convert', saleDraftController.convertDraftToSale);
router.delete('/drafts/:id', saleDraftController.deleteDraft);

/**
 * Refund routes - MUST be before /:id routes
 */
router.get('/refunds', saleRefundController.getRefunds);
router.get('/refunds/:id', saleRefundController.getRefundById);
router.post('/refunds/:id/approve', saleRefundController.approveRefund);
router.post('/refunds/:id/reject', saleRefundController.rejectRefund);
router.post('/refunds/:id/process', saleRefundController.processRefund);

/**
 * Sale stats routes - MUST be before /:id routes
 */
router.get('/stats', saleController.getSalesStats);
router.get('/top-selling', saleController.getTopSellingDrugs);
router.get('/next-invoice', saleController.getNextInvoiceNumber);

/**
 * Invoice-specific route
 */
router.get('/invoice/:invoiceNumber', saleController.getSaleByInvoiceNumber);

/**
 * Sale routes with dynamic parameters - MUST be AFTER specific routes
 */
router.get('/', validate(saleQuerySchema, 'query'), saleController.getSales);
router.get('/:id', saleController.getSaleById);
router.get('/:id/invoice/pdf', saleController.downloadInvoicePDF);
router.post('/', validate(saleCreateSchema), auditLogger.logActivity('SALE_CREATED', 'sale'), saleController.createSale);

/**
 * Refund initiation for specific sale - uses :saleId to avoid conflict
 */
router.post('/:saleId/refunds', auditLogger.logActivity('SALE_REFUND_INITIATED', 'refund'), saleRefundController.initiateRefund);

module.exports = router;
