const purchaseOrderService = require('../../services/purchaseOrders/purchaseOrderService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../Utils/ApiResponse');

/**
 * Supplier Controllers
 */
const getSuppliers = asyncHandler(async (req, res) => {
    const { suppliers, total } = await purchaseOrderService.getSuppliers(req.query);

    const response = ApiResponse.paginated(suppliers, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

const getSupplierById = asyncHandler(async (req, res) => {
    const supplier = await purchaseOrderService.getSupplierById(req.params.id);

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
    const po = await purchaseOrderService.getPOById(req.params.id);

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

module.exports = {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    getPurchaseOrders,
    getPOById,
    createPO,
    approvePO,
    sendPO,
    createReceipt,
    getPOStats,
};
