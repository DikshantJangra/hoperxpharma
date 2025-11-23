const inventoryService = require('../../services/inventory/inventoryService');
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
    const { drugs, total } = await inventoryService.getDrugs(req.query);

    const response = ApiResponse.paginated(drugs, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
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
    const drug = await inventoryService.createDrug(req.body);

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
 * Get inventory batches
 */
const getBatches = asyncHandler(async (req, res) => {
    const { batches, total } = await inventoryService.getBatches({
        ...req.query,
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
    });

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

module.exports = {
    getDrugs,
    getDrugById,
    createDrug,
    updateDrug,
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    adjustStock,
    getLowStockAlerts,
    getExpiringItems,
    getInventorySummary,
};
