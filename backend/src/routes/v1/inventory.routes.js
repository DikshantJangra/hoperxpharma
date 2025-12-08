const express = require('express');
const inventoryController = require('../../controllers/inventory/inventoryController');
const { authenticate } = require('../../middlewares/auth');
const { requireStoreAccess, requirePharmacist } = require('../../middlewares/rbac');
const validate = require('../../middlewares/validate');
const auditLogger = require('../../middlewares/auditLogger');
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
router.post('/drugs', requirePharmacist, validate(drugSchema), auditLogger.logActivity('DRUG_CREATED', 'drug'), inventoryController.createDrug);
router.put('/drugs/:id', requirePharmacist, validate(drugSchema), auditLogger.logActivity('DRUG_UPDATED', 'drug'), inventoryController.updateDrug);
router.delete('/drugs/:id', requirePharmacist, auditLogger.logActivity('DRUG_DELETED', 'drug'), inventoryController.deleteDrug);

/**
 * Batch routes (require store access)
 */
router.get('/batches', requireStoreAccess, validate(inventoryQuerySchema, 'query'), inventoryController.getBatches);
router.get('/batches/:id', inventoryController.getBatchById);
router.post('/batches', requireStoreAccess, validate(batchCreateSchema), auditLogger.logActivity('BATCH_CREATED', 'batch'), inventoryController.createBatch);
router.put('/batches/:id', requirePharmacist, validate(batchUpdateSchema), auditLogger.logActivity('BATCH_UPDATED', 'batch'), inventoryController.updateBatch);
router.delete('/batches/:id', requirePharmacist, auditLogger.logActivity('BATCH_DELETED', 'batch'), inventoryController.deleteBatch);
router.patch('/batches/:id/location', requirePharmacist, auditLogger.logActivity('BATCH_LOCATION_UPDATED', 'batch'), inventoryController.updateBatchLocation);

/**
 * Drug-specific batch routes
 */
router.get('/drugs/:drugId/batches-with-suppliers', inventoryController.getBatchesWithSuppliers);

/**
 * Stock management
 */
router.post('/stock/adjust', requirePharmacist, validate(stockAdjustmentSchema), auditLogger.logActivity('INVENTORY_ADJUSTED', 'inventory'), inventoryController.adjustStock);

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

