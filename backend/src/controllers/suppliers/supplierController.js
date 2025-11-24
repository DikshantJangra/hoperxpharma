const supplierService = require('../../services/suppliers/supplierService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Get all suppliers
 */
const getSuppliers = asyncHandler(async (req, res) => {
    const { suppliers, total } = await supplierService.getSuppliers(req.query);

    const response = ApiResponse.paginated(suppliers, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get supplier by ID
 */
const getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await supplierService.getSupplierById(req.params.id);

    const response = ApiResponse.success(supplier);
    res.status(response.statusCode).json(response);
});

/**
 * Create supplier
 */
const createSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.createSupplier(req.body);

    const response = ApiResponse.created(supplier, 'Supplier created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Update supplier
 */
const updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);

    const response = ApiResponse.success(supplier, 'Supplier updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Delete supplier
 */
const deleteSupplier = asyncHandler(async (req, res) => {
    const result = await supplierService.deleteSupplier(req.params.id);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

/**
 * Get supplier statistics
 */
const getSupplierStats = asyncHandler(async (req, res) => {
    const stats = await supplierService.getSupplierStats();

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
