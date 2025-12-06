const saleRefundService = require('../../services/sales/saleRefundService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * Initiate refund
 */
const initiateRefund = asyncHandler(async (req, res) => {
    const refund = await saleRefundService.initiateRefund(req.params.saleId, {
        ...req.body,
        storeId: req.storeId,
        requestedBy: req.user.id,
    });

    const response = ApiResponse.created(refund, 'Refund request created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get all refunds
 */
const getRefunds = asyncHandler(async (req, res) => {
    const { refunds, total } = await saleRefundService.getRefunds(req.storeId, req.query);

    const response = ApiResponse.paginated(refunds, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get refund by ID
 */
const getRefundById = asyncHandler(async (req, res) => {
    const refund = await saleRefundService.getRefundById(req.params.id);

    const response = ApiResponse.success(refund);
    res.status(response.statusCode).json(response);
});

/**
 * Approve refund
 */
const approveRefund = asyncHandler(async (req, res) => {
    const refund = await saleRefundService.approveRefund(req.params.id, req.user.id);

    const response = ApiResponse.success(refund, 'Refund approved successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Reject refund
 */
const rejectRefund = asyncHandler(async (req, res) => {
    const refund = await saleRefundService.rejectRefund(req.params.id, req.body.reason);

    const response = ApiResponse.success(refund, 'Refund rejected');
    res.status(response.statusCode).json(response);
});

/**
 * Process refund (complete and restore inventory)
 */
const processRefund = asyncHandler(async (req, res) => {
    const refund = await saleRefundService.processRefund(req.params.id);

    const response = ApiResponse.success(refund, 'Refund processed successfully');
    res.status(response.statusCode).json(response);
});

module.exports = {
    initiateRefund,
    getRefunds,
    getRefundById,
    approveRefund,
    rejectRefund,
    processRefund,
};
