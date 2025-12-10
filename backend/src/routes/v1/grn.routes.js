const express = require('express');
const router = express.Router();
const grnController = require('../../controllers/grn/grnController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    createGRNSchema,
    updateGRNItemSchema,
    splitBatchSchema,
    recordDiscrepancySchema,
    completeGRNSchema
} = require('../../validators/grn.validator');

/**
 * GRN Routes
 */

// Create GRN from PO
router.post('/', authenticate, validate(createGRNSchema), grnController.createGRN);

// Get GRNs with filters
// FIX: Added requireStoreAccess to scope results to the user's store
router.get('/', authenticate, requireStoreAccess, grnController.getGRNs);

// Get GRNs by PO
router.get('/po/:poId', authenticate, grnController.getGRNsByPO);

// Get GRN by ID
router.get('/:id', authenticate, grnController.getGRN);

// Update GRN (for draft saving)
router.patch('/:id', authenticate, grnController.updateGRN);

// Update GRN item
router.patch('/:id/items/:itemId', authenticate, validate(updateGRNItemSchema), grnController.updateGRNItem);

// Split batch
router.post('/:id/items/:itemId/split', authenticate, validate(splitBatchSchema), grnController.splitBatch);

// Delete GRN item (child batch)
router.delete('/:id/items/:itemId', authenticate, grnController.deleteGRNItem);

// Record discrepancy
router.post('/:id/discrepancies', authenticate, validate(recordDiscrepancySchema), grnController.recordDiscrepancy);

// Complete GRN
router.post('/:id/complete', authenticate, validate(completeGRNSchema), grnController.completeGRN);

// Cancel GRN
router.delete('/:id', authenticate, grnController.cancelGRN);

module.exports = router;
