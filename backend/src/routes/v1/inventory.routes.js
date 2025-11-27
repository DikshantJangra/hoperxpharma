const express = require('express');
const inventoryController = require('../../controllers/inventory/inventoryController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess, requirePharmacist } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const {
    drugSchema,
    batchCreateSchema,
    batchUpdateSchema,
    stockAdjustmentSchema,
    inventoryQuerySchema,
} = require('../../validators/inventory.validator');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Drug routes
 */
router.get('/drugs', requireStoreAccess, validate(inventoryQuerySchema, 'query'), inventoryController.getDrugs);
router.get('/drugs/:id', inventoryController.getDrugById);
router.post('/drugs', requirePharmacist, validate(drugSchema), inventoryController.createDrug);
router.put('/drugs/:id', requirePharmacist, validate(drugSchema), inventoryController.updateDrug);

/**
 * Batch routes (require store access)
 */
router.get('/batches', requireStoreAccess, validate(inventoryQuerySchema, 'query'), inventoryController.getBatches);
router.get('/batches/:id', inventoryController.getBatchById);
router.post('/batches', requireStoreAccess, validate(batchCreateSchema), inventoryController.createBatch);
router.put('/batches/:id', requirePharmacist, validate(batchUpdateSchema), inventoryController.updateBatch);

/**
 * Stock management
 */
router.post('/stock/adjust', requirePharmacist, validate(stockAdjustmentSchema), inventoryController.adjustStock);

/**
 * Alerts and summaries
 */
router.get('/alerts/low-stock', requireStoreAccess, inventoryController.getLowStockAlerts);
router.get('/alerts/expiring', requireStoreAccess, inventoryController.getExpiringItems);
router.get('/summary', requireStoreAccess, inventoryController.getInventorySummary);

/**
 * POS specific routes
 */
router.get('/pos/search', requireStoreAccess, inventoryController.searchDrugsForPOS);

module.exports = router;

