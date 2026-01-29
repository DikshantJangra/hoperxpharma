const inventoryService = require('../../services/inventory/inventoryService');
const logger = require('../../config/logger');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management endpoints
 */

/**
 * Get all drugs
 */
const getDrugs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Extract filter parameters
    const stockStatus = req.query.stockStatus ?
        (Array.isArray(req.query.stockStatus) ? req.query.stockStatus : [req.query.stockStatus]) : [];
    const expiryWindow = req.query.expiryWindow ?
        (Array.isArray(req.query.expiryWindow) ? req.query.expiryWindow : [req.query.expiryWindow]) : [];
    const storage = req.query.storage ?
        (Array.isArray(req.query.storage) ? req.query.storage : [req.query.storage]) : [];

    const { drugs, total } = await inventoryService.getDrugs({
        ...req.query,
        page,
        limit,
        storeId: req.storeId,
        stockStatus,
        expiryWindow,
        storage
    });

    const response = ApiResponse.paginated(drugs, {
        page,
        limit,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get drug by ID
 */
const getDrugById = asyncHandler(async (req, res) => {
    const drug = await inventoryService.getDrugById(req.params.id);

    const response = ApiResponse.success(drug);
    res.status(response.statusCode).json(response);
});

/**
 * Create drug
 */
const createDrug = asyncHandler(async (req, res) => {
    const drug = await inventoryService.createDrug({
        ...req.body,
        storeId: req.storeId
    }, req.user?.id);

    const response = ApiResponse.created(drug, 'Drug created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update drug
 */
const updateDrug = asyncHandler(async (req, res) => {
    const drug = await inventoryService.updateDrug(req.params.id, req.body);

    const response = ApiResponse.success(drug, 'Drug updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete drug and all its batches
 */
const deleteDrug = asyncHandler(async (req, res) => {
    const result = await inventoryService.deleteDrug(req.params.id, req.user.id);

    const response = ApiResponse.success(result, `Drug and ${result.deletedBatchCount} batches deleted successfully`);
    res.status(response.statusCode).json(response);
});

/**
 * Get inventory batches
 */
const getBatches = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const { batches, total } = await inventoryService.getBatches({
        ...req.query,
        page,
        limit,
        storeId: req.storeId,
    });

    const response = ApiResponse.paginated(batches, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get batch by ID
 */
const getBatchById = asyncHandler(async (req, res) => {
    const batch = await inventoryService.getBatchById(req.params.id);

    const response = ApiResponse.success(batch);
    res.status(response.statusCode).json(response);
});

/**
 * Create batch
 */
const createBatch = asyncHandler(async (req, res) => {
    const batch = await inventoryService.createBatch({
        ...req.body,
        storeId: req.storeId,
    }, req.user?.id);

    const response = ApiResponse.created(batch, 'Batch created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update batch
 */
const updateBatch = asyncHandler(async (req, res) => {
    const batch = await inventoryService.updateBatch(req.params.id, req.body);

    const response = ApiResponse.success(batch, 'Batch updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Adjust stock
 */
const adjustStock = asyncHandler(async (req, res) => {
    const result = await inventoryService.adjustStock({
        ...req.body,
        userId: req.user.id,
    });

    const response = ApiResponse.success(result, 'Stock adjusted successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get low stock alerts
 */
const getLowStockAlerts = asyncHandler(async (req, res) => {
    const alerts = await inventoryService.getLowStockAlerts(req.storeId);

    const response = ApiResponse.success(alerts);
    res.status(response.statusCode).json(response);
});

/**
 * Get expiring items
 */
const getExpiringItems = asyncHandler(async (req, res) => {
    const daysAhead = parseInt(req.query.daysAhead) || 90;
    const items = await inventoryService.getExpiringItems(req.storeId, daysAhead);

    const response = ApiResponse.success(items);
    res.status(response.statusCode).json(response);
});

/**
 * Get inventory summary
 */
const getInventorySummary = asyncHandler(async (req, res) => {
    const summary = await inventoryService.getInventorySummary(req.storeId);

    const response = ApiResponse.success(summary);
    res.status(response.statusCode).json(response);
});

/**
 * Search drugs for POS with stock availability
 */
const searchDrugsForPOS = asyncHandler(async (req, res) => {
    const { search } = req.query;

    logger.info('🔍 POS Search Controller - storeId:', req.storeId, 'search:', search);

    if (!search || search.length < 2) {
        return res.status(200).json(ApiResponse.success([]));
    }

    const drugs = await inventoryService.searchDrugsForPOS(req.storeId, search);
    logger.info('🔍 POS Search Controller - Results:', drugs.length);
    const response = ApiResponse.success(drugs);
    res.status(response.statusCode).json(response);
});

/**
 * Update batch location
 */
const updateBatchLocation = asyncHandler(async (req, res) => {
    const { location } = req.body;
    const batch = await inventoryService.updateBatchLocation(req.params.id, location);

    const response = ApiResponse.success(batch, 'Batch location updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete batch
 */
const deleteBatch = asyncHandler(async (req, res) => {
    const batch = await inventoryService.deleteBatch(req.params.id, req.user.id);

    const response = ApiResponse.success(batch, 'Batch deleted successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get batches with suppliers for a drug
 */
const getBatchesWithSuppliers = asyncHandler(async (req, res) => {
    const batches = await inventoryService.getBatchesWithSuppliers(req.params.drugId);

    const response = ApiResponse.success(batches);
    res.status(response.statusCode).json(response);
});

/**
 * Check if a batch exists (for receiving visual indicators)
 */
const checkBatch = asyncHandler(async (req, res) => {
    const { drugId, batchNumber } = req.query;
    const storeId = req.user?.primaryStoreId || req.storeId;

    if (!drugId || !batchNumber) {
        return res.status(400).json(ApiResponse.error('drugId and batchNumber are required'));
    }

    const result = await inventoryService.checkBatchExists(storeId, drugId, batchNumber);

    // Always return 200 success - exists:false just means it's a new batch (not an error)
    return res.json(ApiResponse.success(result, result.exists ? 'Batch found in inventory' : 'New batch'));
});

/**
 * Bulk check a list of batches
 * Body: { items: [{ drugId, batchNumber }] }
 */
const checkBatchesBulk = asyncHandler(async (req, res) => {
    const { items } = req.body;
    const storeId = req.user?.primaryStoreId || req.storeId;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json(ApiResponse.error('Items array is required'));
    }

    const result = await inventoryService.checkBatchesBulk(storeId, items);

    return res.json(ApiResponse.success(result, 'Bulk check complete'));
});

/**
 * Get batch history for smart suggest
 */
const getBatchHistory = asyncHandler(async (req, res) => {
    const { drugIds } = req.body; // POST to allow body with array properly

    if (!drugIds || !Array.isArray(drugIds)) {
        return res.status(400).json(ApiResponse.error('drugIds array is required'));
    }

    const history = await inventoryService.getBatchHistory(req.storeId, drugIds);
    const response = ApiResponse.success(history);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getDrugs,
    getDrugById,
    createDrug,
    updateDrug,
    deleteDrug,
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    adjustStock,
    getLowStockAlerts,
    getExpiringItems,
    getInventorySummary,
    searchDrugsForPOS,
    updateBatchLocation,
    getBatchesWithSuppliers,
    getBatchHistory,
    checkBatch,
    checkBatchesBulk,
};
