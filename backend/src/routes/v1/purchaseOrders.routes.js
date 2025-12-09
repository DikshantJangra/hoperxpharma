const express = require('express');
const poController = require('../../controllers/purchaseOrders/purchaseOrderController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess, requirePharmacist } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    supplierCreateSchema,
    supplierUpdateSchema,
    poCreateSchema,
    receiptCreateSchema,
    poQuerySchema,
} = require('../../validators/purchaseOrder.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Supplier routes
 */
router.get('/suppliers', requireStoreAccess, validate(poQuerySchema, 'query'), poController.getSuppliers);
router.get('/suppliers/:id', requireStoreAccess, poController.getSupplierById);
router.post('/suppliers', requirePharmacist, validate(supplierCreateSchema), poController.createSupplier);
router.put('/suppliers/:id', requirePharmacist, validate(supplierUpdateSchema), poController.updateSupplier);

/**
 * Purchase Order routes (require store access)
 */
router.get('/', requireStoreAccess, validate(poQuerySchema, 'query'), poController.getPurchaseOrders);
router.get('/stats', requireStoreAccess, poController.getPOStats);
router.get('/inventory/suggestions', requireStoreAccess, poController.getInventorySuggestions);
router.post('/validate', poController.validatePO);
router.get('/:id/preview.pdf', requireStoreAccess, poController.getPreviewPdf);
router.get('/:id', requireStoreAccess, poController.getPOById);
router.post('/', requireStoreAccess, validate(poCreateSchema), poController.createPO);
router.put('/:id', requireStoreAccess, validate(poCreateSchema), poController.updatePO);
router.post('/:id/request-approval', requireStoreAccess, poController.requestApproval);
router.put('/:id/approve', requirePharmacist, poController.approvePO);
router.put('/:id/send', requirePharmacist, poController.sendPO);
router.post('/:id/receipts', requireStoreAccess, validate(receiptCreateSchema), poController.createReceipt);
router.delete('/:id', requirePharmacist, poController.deletePO);


/**
 * Efficient PO Composer routes
 */
router.post('/calc', poController.calculatePO);
router.post('/bulk-add', requireStoreAccess, poController.bulkAddItems);
router.put('/:id/autosave', requireStoreAccess, poController.autosavePO);

/**
 * Template routes
 */
const templateController = require('../../controllers/purchaseOrders/poTemplateController');

router.get('/templates', requireStoreAccess, templateController.getTemplates);
router.get('/templates/:id', requireStoreAccess, templateController.getTemplateById);
router.post('/templates', requireStoreAccess, templateController.createTemplate);
router.put('/templates/:id', requireStoreAccess, templateController.updateTemplate);
router.delete('/templates/:id', requireStoreAccess, templateController.deleteTemplate);
router.post('/templates/:id/load', requireStoreAccess, templateController.loadTemplate);
router.post('/templates/:id/duplicate', requireStoreAccess, templateController.duplicateTemplate);

module.exports = router;
