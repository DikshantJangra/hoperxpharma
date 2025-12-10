const saleService = require('../../services/sales/saleService');
const pdfService = require('../../services/pdf/pdfService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

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
    console.log('🔍 DEBUG Controller: req.body.prescriptionId =', req.body.prescriptionId);
    const saleData = {
        ...req.body,
        storeId: req.storeId,
        soldBy: req.user.id,
    };

    const sale = await saleService.createSale(saleData);

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

/**
 * Download invoice PDF
 */
const downloadInvoicePDF = asyncHandler(async (req, res) => {
    // Get sale with all related data
    const sale = await saleService.getSaleById(req.params.id);

    // Generate PDF
    const pdfBuffer = await pdfService.generateSaleInvoicePdf(sale);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${sale.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
});

/**
 * Get next invoice number
 */
const getNextInvoiceNumber = asyncHandler(async (req, res) => {
    const nextInvoiceNumber = await saleService.getNextInvoiceNumber(req.storeId);
    const response = ApiResponse.success({ nextInvoiceNumber });
    res.status(response.statusCode).json(response);
});

module.exports = {
    getSales,
    getSaleById,
    createSale,
    getSalesStats,
    getTopSellingDrugs,
    getSaleByInvoiceNumber,
    downloadInvoicePDF,
    getNextInvoiceNumber,
};
