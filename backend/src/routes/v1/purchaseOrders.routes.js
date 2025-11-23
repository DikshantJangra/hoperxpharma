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
router.get('/suppliers', validate(poQuerySchema, 'query'), poController.getSuppliers);
router.get('/suppliers/:id', poController.getSupplierById);
router.post('/suppliers', requirePharmacist, validate(supplierCreateSchema), poController.createSupplier);
router.put('/suppliers/:id', requirePharmacist, validate(supplierUpdateSchema), poController.updateSupplier);

/**
 * Purchase Order routes (require store access)
 */
router.get('/', requireStoreAccess, validate(poQuerySchema, 'query'), poController.getPurchaseOrders);
router.get('/stats', requireStoreAccess, poController.getPOStats);
router.get('/:id', poController.getPOById);
router.post('/', requireStoreAccess, validate(poCreateSchema), poController.createPO);
router.put('/:id/approve', requirePharmacist, poController.approvePO);
router.put('/:id/send', requirePharmacist, poController.sendPO);
router.post('/:id/receipts', requireStoreAccess, validate(receiptCreateSchema), poController.createReceipt);

module.exports = router;
