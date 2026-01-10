const asyncHandler = require('../../middlewares/asyncHandler');
const compilationService = require('../../services/invoices/compilationService');
const prisma = require('../../db/prisma');
const ApiError = require('../../utils/ApiError');

/**
 * Get eligible items for invoice compilation
 * GET /api/v1/supplier-invoices/eligible-items
 */
exports.getEligibleItems = asyncHandler(async (req, res) => {
    console.log('GET /supplier-invoices/eligible-items');
    console.log('Query params:', req.query);
    console.log('Body:', req.body);

    const { supplierId, storeId, periodStart, periodEnd } = req.query;

    if (!supplierId || !storeId || !periodStart || !periodEnd) {
        throw new ApiError(400, 'Missing required parameters: supplierId, storeId, periodStart, periodEnd');
    }

    const items = await compilationService.getEligibleItems({
        supplierId,
        storeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd)
    });

    res.json({
        success: true,
        data: items,
        count: items.length
    });
});

/**
 * Create draft supplier invoice
 * POST /api/v1/supplier-invoices/draft
 */
exports.createDraftInvoice = asyncHandler(async (req, res) => {
    const { supplierId, storeId, periodStart, periodEnd, selectedGrnItemIds } = req.body;
    const userId = req.user.id;

    if (!supplierId || !storeId || !periodStart || !periodEnd || !selectedGrnItemIds || selectedGrnItemIds.length === 0) {
        throw new ApiError(400, 'Missing required fields');
    }

    const invoice = await compilationService.createDraftInvoice({
        supplierId,
        storeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        selectedGrnItemIds,
        userId
    });

    res.status(201).json({
        success: true,
        data: invoice
    });
});

/**
 * Confirm invoice (lock and generate final number)
 * POST /api/v1/supplier-invoices/:id/confirm
 */
exports.confirmInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await compilationService.confirmInvoice({
        invoiceId: id,
        userId
    });

    res.json({
        success: true,
        data: invoice
    });
});

/**
 * Record payment
 * POST /api/v1/supplier-invoices/:id/payments
 */
exports.recordPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;
    const userId = req.user.id;

    if (!amount || !paymentDate || !paymentMethod) {
        throw new ApiError(400, 'Missing required payment fields: amount, paymentDate, paymentMethod');
    }

    const invoice = await compilationService.recordPayment({
        invoiceId: id,
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        paymentMethod,
        referenceNumber,
        notes,
        userId
    });

    res.json({
        success: true,
        data: invoice
    });
});

/**
 * Get all supplier invoices
 * GET /api/v1/supplier-invoices
 */
exports.getInvoices = asyncHandler(async (req, res) => {
    const { storeId, supplierId, status, periodStart, periodEnd, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (storeId) where.storeId = storeId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (periodStart || periodEnd) {
        where.periodStart = {};
        if (periodStart) where.periodStart.gte = new Date(periodStart);
        if (periodEnd) where.periodStart.lte = new Date(periodEnd);
    }

    const [invoices, total] = await Promise.all([
        prisma.consolidatedInvoice.findMany({
            where,
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                items: {
                    select: {
                        id: true,
                        drugName: true,
                        billedQty: true,
                        lineTotal: true
                    }
                },
                payments: true
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        }),
        prisma.consolidatedInvoice.count({ where })
    ]);

    res.json({
        success: true,
        data: invoices,
        pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        }
    });
});

/**
 * Get single invoice by ID
 * GET /api/v1/supplier-invoices/:id
 */
exports.getInvoiceById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await prisma.consolidatedInvoice.findUnique({
        where: { id },
        include: {
            supplier: true,
            items: {
                include: {
                    grnItem: {
                        select: {
                            batchNumber: true,
                            expiryDate: true
                        }
                    }
                }
            },
            grns: {
                include: {
                    grn: {
                        select: {
                            grnNumber: true,
                            completedAt: true,
                            po: {
                                select: {
                                    poNumber: true
                                }
                            }
                        }
                    }
                }
            },
            payments: {
                include: {
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            createdByUser: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            confirmedByUser: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            }
        }
    });

    if (!invoice) {
        throw new ApiError(404, 'Invoice not found');
    }

    res.json({
        success: true,
        data: invoice
    });
});

/**
 * Update draft invoice items
 * PATCH /api/v1/supplier-invoices/:id
 */
exports.updateDraftInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { notes, supplierInvoiceNo, supplierInvoiceDate } = req.body;

    const invoice = await prisma.consolidatedInvoice.findUnique({
        where: { id }
    });

    if (!invoice) {
        throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
        throw new ApiError(400, 'Can only update draft invoices');
    }

    const updated = await prisma.consolidatedInvoice.update({
        where: { id },
        data: {
            notes,
            supplierInvoiceNo,
            supplierInvoiceDate: supplierInvoiceDate ? new Date(supplierInvoiceDate) : undefined
        },
        include: {
            items: true,
            supplier: true
        }
    });

    res.json({
        success: true,
        data: updated
    });
});

/**
 * Delete draft invoice
 * DELETE /api/v1/supplier-invoices/:id
 */
exports.deleteDraftInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await prisma.consolidatedInvoice.findUnique({
        where: { id }
    });

    if (!invoice) {
        throw new ApiError(404, 'Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
        throw new ApiError(400, 'Can only delete draft invoices');
    }

    await prisma.consolidatedInvoice.delete({
        where: { id }
    });

    res.json({
        success: true,
        message: 'Draft invoice deleted successfully'
    });
});
