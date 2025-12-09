const purchaseOrderService = require('../../services/purchaseOrders/purchaseOrderService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Supplier Controllers
 */
const getSuppliers = asyncHandler(async (req, res) => {
    // Extract storeId from authenticated user (now guaranteed by requireStoreAccess)
    const storeId = req.storeId;

    if (!storeId) {
        throw ApiError.badRequest('No store associated with user');
    }

    const { suppliers, total } = await purchaseOrderService.getSuppliers({
        ...req.query,
        storeId
    });

    const response = ApiResponse.paginated(suppliers, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

const getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await purchaseOrderService.getSupplierById(req.params.id, req.storeId);

    const response = ApiResponse.success(supplier);
    res.status(response.statusCode).json(response);
});

const createSupplier = asyncHandler(async (req, res) => {
    const supplier = await purchaseOrderService.createSupplier(req.body);

    const response = ApiResponse.created(supplier, 'Supplier created successfully');
    res.status(response.statusCode).json(response);
});

const updateSupplier = asyncHandler(async (req, res) => {
    const supplier = await purchaseOrderService.updateSupplier(req.params.id, req.body);

    const response = ApiResponse.success(supplier, 'Supplier updated successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Purchase Order Controllers
 */
const getPurchaseOrders = asyncHandler(async (req, res) => {
    const { orders, total } = await purchaseOrderService.getPurchaseOrders({
        ...req.query,
        storeId: req.storeId,
    });

    const response = ApiResponse.paginated(orders, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

const getPOById = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.getPOById(req.params.id, req.storeId);

    const response = ApiResponse.success(po);
    res.status(response.statusCode).json(response);
});

const createPO = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.createPO({
        ...req.body,
        storeId: req.storeId,
        createdBy: req.user.id,
    });

    const response = ApiResponse.created(po, 'Purchase order created successfully');
    res.status(response.statusCode).json(response);
});

const updatePO = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.updatePO(req.params.id, {
        ...req.body,
        storeId: req.storeId,
    });

    const response = ApiResponse.success(po, 'Purchase order updated successfully');
    res.status(response.statusCode).json(response);
});

const approvePO = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.approvePO(req.params.id, req.user.id);

    const response = ApiResponse.success(po, 'Purchase order approved successfully');
    res.status(response.statusCode).json(response);
});

const sendPO = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.sendPO(req.params.id);

    const response = ApiResponse.success(po, 'Purchase order sent successfully');
    res.status(response.statusCode).json(response);
});

const createReceipt = asyncHandler(async (req, res) => {
    const receipt = await purchaseOrderService.createReceipt({
        ...req.body,
        receivedBy: req.user.id,
    });

    const response = ApiResponse.created(receipt, 'Receipt created and inventory updated successfully');
    res.status(response.statusCode).json(response);
});

const getPOStats = asyncHandler(async (req, res) => {
    const stats = await purchaseOrderService.getPOStats(req.storeId);

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

const validatePO = asyncHandler(async (req, res) => {
    const validation = await purchaseOrderService.validatePO(req.body);

    const response = ApiResponse.success(validation);
    res.status(response.statusCode).json(response);
});

const requestApproval = asyncHandler(async (req, res) => {
    const { approvers, note } = req.body;
    const poId = req.params.id;

    const result = await purchaseOrderService.requestApproval({
        poId,
        requestedBy: req.user.id,
        approvers,
        note
    });

    const response = ApiResponse.success(result, 'Approval request sent successfully');
    res.status(response.statusCode).json(response);
});

const getInventorySuggestions = asyncHandler(async (req, res) => {
    const { limit = 100 } = req.query;

    const suggestions = await purchaseOrderService.getInventorySuggestions({
        storeId: req.storeId,
        limit: parseInt(limit),
    });

    const response = ApiResponse.success(suggestions);
    res.status(response.statusCode).json(response);
});

const pdfService = require('../../services/pdf/pdfService');

const getPreviewPdf = asyncHandler(async (req, res) => {
    const po = await purchaseOrderService.getPOById(req.params.id, req.storeId);

    if (!po) {
        throw new ApiError(404, 'Purchase order not found');
    }

    const pdfBuffer = await pdfService.generatePOPdf(po);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=PO-${po.poNumber}.pdf`,
        'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
});

/**
 * Efficient PO Composer Controllers
 */

const calculatePO = asyncHandler(async (req, res) => {
    const { lines } = req.body;

    if (!lines || !Array.isArray(lines)) {
        throw new ApiError(400, 'Lines array is required');
    }

    const result = purchaseOrderService.calculateTotals(lines);

    const response = ApiResponse.success(result);
    res.status(response.statusCode).json(response);
});

const bulkAddItems = asyncHandler(async (req, res) => {
    const { items, supplierId } = req.body;

    if (!items || !Array.isArray(items)) {
        throw new ApiError(400, 'Items array is required');
    }

    const enrichedLines = await purchaseOrderService.bulkEnrichItems(items, supplierId);

    const response = ApiResponse.success({ lines: enrichedLines });
    res.status(response.statusCode).json(response);
});

const autosavePO = asyncHandler(async (req, res) => {
    const result = await purchaseOrderService.autosavePO(req.params.id, req.body);

    const response = ApiResponse.success(result, 'Draft autosaved');
    res.status(response.statusCode).json(response);
});

const deletePO = asyncHandler(async (req, res) => {
    await purchaseOrderService.deletePO(req.params.id, req.storeId);

    const response = ApiResponse.success(null, 'Purchase order deleted successfully');
    res.status(response.statusCode).json(response);
});


module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    getPurchaseOrders,
    getPOById,
    createPO,
    updatePO,
    requestApproval,
    approvePO,
    sendPO,
    createReceipt,
    getPOStats,
    getInventorySuggestions,
    validatePO,
    getPreviewPdf,
    // Efficient PO Composer
    calculatePO,
    bulkAddItems,
    autosavePO,
    deletePO,
};
