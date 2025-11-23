const saleService = require('../../services/sales/saleService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../Utils/ApiResponse');

/**
 * Get all sales
 */
const getSales = asyncHandler(async (req, res) => {
    const { sales, total } = await saleService.getSales({
        ...req.query,
        storeId: req.storeId,
    });

    const response = ApiResponse.paginated(sales, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        total,
    });

    res.status(response.statusCode).json(response);
});

/**
 * Get sale by ID
 */
const getSaleById = asyncHandler(async (req, res) => {
    const sale = await saleService.getSaleById(req.params.id);

    const response = ApiResponse.success(sale);
    res.status(response.statusCode).json(response);
});

/**
 * Create sale
 */
const createSale = asyncHandler(async (req, res) => {
    const sale = await saleService.createSale({
        ...req.body,
        storeId: req.storeId,
        soldBy: req.user.id,
    });

    const response = ApiResponse.created(sale, 'Sale created successfully');
    res.status(response.statusCode).json(response);
});

/**
 * Get sales statistics
 */
const getSalesStats = asyncHandler(async (req, res) => {
    const stats = await saleService.getSalesStats(
        req.storeId,
        req.query.startDate,
        req.query.endDate
    );

    const response = ApiResponse.success(stats);
    res.status(response.statusCode).json(response);
});

/**
 * Get top selling drugs
 */
const getTopSellingDrugs = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const drugs = await saleService.getTopSellingDrugs(req.storeId, limit);

    const response = ApiResponse.success(drugs);
    res.status(response.statusCode).json(response);
});

/**
 * Get sale by invoice number
 */
const getSaleByInvoiceNumber = asyncHandler(async (req, res) => {
    const sale = await saleService.getSaleByInvoiceNumber(req.params.invoiceNumber);

    const response = ApiResponse.success(sale);
    res.status(response.statusCode).json(response);
});

module.exports = {
    getSales,
    getSaleById,
    createSale,
    getSalesStats,
    getTopSellingDrugs,
    getSaleByInvoiceNumber,
};
