const supplierService = require('../../services/suppliers/supplierService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Get all suppliers
 */
const getSuppliers = asyncHandler(async (req, res) => {
    // Get storeId from authenticated user (use primary store)
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    
    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    // Parse query parameters
    const filters = {
        ...req.query,
        storeId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
    };

    const { suppliers, total } = await supplierService.getSuppliers(filters);

    const response = ApiResponse.paginated(suppliers, {
        page: filters.page,
        limit: filters.limit,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get supplier by ID
 */
const getSupplierById = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    const supplier = await supplierService.getSupplierById(req.params.id, storeId);

    const response = ApiResponse.success(supplier);
    res.status(response.statusCode).json(response);
});

/**
 * Create supplier
 */
const createSupplier = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    
    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const supplierData = { ...req.body, storeId };
    const supplier = await supplierService.createSupplier(supplierData);

    const response = ApiResponse.created(supplier, 'Supplier created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update supplier
 */
const updateSupplier = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    const supplier = await supplierService.updateSupplier(req.params.id, req.body, storeId);

    const response = ApiResponse.success(supplier, 'Supplier updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete supplier
 */
const deleteSupplier = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    const result = await supplierService.deleteSupplier(req.params.id, storeId);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Get supplier statistics
 */
const getSupplierStats = asyncHandler(async (req, res) => {
    const storeId = req.user.stores?.find(s => s.isPrimary)?.id || req.user.stores?.[0]?.id;
    
    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const stats = await supplierService.getSupplierStats(storeId);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierStats,
};
