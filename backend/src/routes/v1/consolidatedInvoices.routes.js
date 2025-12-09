const express = require('express');
const router = express.Router();
const consolidatedInvoiceController = require('../../controllers/consolidatedInvoices/consolidatedInvoiceController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');

// All routes require authentication and store access
router.use(authenticate);
router.use(requireStoreAccess);

// Get GRNs available for invoicing
router.get('/grns', consolidatedInvoiceController.getGRNsForInvoicing);

// Create consolidated invoice
router.post('/', consolidatedInvoiceController.createInvoice);

// List all consolidated invoices
router.get('/', consolidatedInvoiceController.listInvoices);

// Get invoice by ID
router.get('/:id', consolidatedInvoiceController.getInvoiceById);

// Update invoice status
router.patch('/:id/status', consolidatedInvoiceController.updateInvoiceStatus);

// Finalize invoice
router.post('/:id/finalize', consolidatedInvoiceController.finalizeInvoice);

// Delete invoice
router.delete('/:id', consolidatedInvoiceController.deleteInvoice);

module.exports = router;
