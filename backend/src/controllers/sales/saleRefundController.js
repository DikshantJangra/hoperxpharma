const asyncHandler = require('../../middlewares/asyncHandler');
const saleRefundService = require('../../services/sales/saleRefundService');

const initiateRefund = asyncHandler(async (req, res) => {
    const { saleId } = req.body; // or req.params.saleId depending on route
    // Route is /:saleId/refunds, so use params
    const idToUse = req.params.saleId || req.body.saleId;
    const refund = await saleRefundService.initiateRefund(idToUse, {
        ...req.body,
        requestedBy: req.user.id,
        storeId: req.user.storeId
    });
    res.status(201).send(refund);
});

const approveRefund = asyncHandler(async (req, res) => {
    const { id } = req.params; // Route uses :id
    const refund = await saleRefundService.approveRefund(id, req.user.id);
    res.send(refund);
});

const rejectRefund = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const refund = await saleRefundService.rejectRefund(id, reason);
    res.send(refund);
});

const processRefund = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const refund = await saleRefundService.processRefund(id);
    res.send(refund);
});

const getRefunds = asyncHandler(async (req, res) => {
    const filter = { ...req.query, storeId: req.user.storeId };
    const result = await saleRefundService.getRefunds(req.user.storeId, filter);
    res.send(result);
});

const getRefundById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const refund = await saleRefundService.getRefundById(id);
    res.send(refund);
});

module.exports = {
    initiateRefund,
    approveRefund,
    rejectRefund,
    processRefund,
    getRefunds,
    getRefundById
};
