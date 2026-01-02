const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

class ConsolidatedInvoiceRepository {
    /**
     * Get GRNs available for invoicing
     */
    async getGRNsForInvoicing(storeId, filters = {}) {
        const { startDate, endDate, supplierId, status = 'all' } = filters;

        logger.info('[Repo] getGRNsForInvoicing');
        logger.info(`[Repo] StoreId: ${storeId}`);
        logger.info(`[Repo] Filters:`, filters);

        const where = {
            storeId,
            status: 'COMPLETED',
            // deletedAt: null // Ensure we don't fetch deleted ones if using soft delete
        };

        if (startDate || endDate) {
            where.receivedDate = {};
            if (startDate) where.receivedDate.gte = new Date(startDate);
            if (endDate) {
                // If endDate is provided, ensure we cover the entire day by setting to 23:59:59.999
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                where.receivedDate.lte = end;
            }
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        // Filter by invoicing status
        if (status === 'not_invoiced') {
            where.ConsolidatedInvoiceGRN = {
                none: {}
            };
        }

        logger.info('[Repo] Generated WHERE:', JSON.stringify(where, null, 2));

        const grns = await prisma.goodsReceivedNote.findMany({
            where,
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                        gstin: true,
                        contactName: true,
                        phoneNumber: true,
                    }
                },
                items: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                },
                ConsolidatedInvoiceGRN: {
                    include: {
                        consolidatedInvoice: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                status: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                receivedDate: 'desc'
            }
        });

        // Transform to include computed fields
        return grns.map(grn => ({
            ...grn,
            itemsCount: grn.items.length,
            isInvoiced: grn.ConsolidatedInvoiceGRN.length > 0,
            consolidatedInvoice: grn.ConsolidatedInvoiceGRN[0]?.consolidatedInvoice || null,
        }));
    }

    /**
     * Generate next invoice number
     */
    async generateInvoiceNumber(storeId) {
        const year = new Date().getFullYear();
        const prefix = `CI-${year}-`;

        const lastInvoice = await prisma.consolidatedInvoice.findFirst({
            where: {
                storeId,
                invoiceNumber: {
                    startsWith: prefix
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        let nextNumber = 1;
        if (lastInvoice) {
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop());
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${String(nextNumber).padStart(4, '0')}`;
    }

    /**
     * Create consolidated invoice
     */
    async createConsolidatedInvoice(data, userId) {
        const { grnIds, type, periodStart, periodEnd, notes, storeId } = data;

        // Fetch GRNs to consolidate
        const grns = await prisma.goodsReceivedNote.findMany({
            where: {
                id: { in: grnIds },
                storeId,
            },
            include: {
                supplier: true,
                items: {
                    include: {
                        drug: true,
                    }
                }
            }
        });

        if (grns.length === 0) {
            throw new Error('No valid GRNs found');
        }

        // Determine supplier (single or multi)
        const uniqueSuppliers = [...new Set(grns.map(g => g.supplierId))];
        const supplierId = uniqueSuppliers.length === 1 ? uniqueSuppliers[0] : null;

        // Consolidate items by drug
        const itemsMap = new Map();

        grns.forEach(grn => {
            grn.items.forEach(item => {
                const key = `${item.drugId}-${item.batchNumber || 'no-batch'}`;

                if (itemsMap.has(key)) {
                    const existing = itemsMap.get(key);
                    existing.totalQuantity += item.quantityReceived;
                    existing.subtotal += parseFloat(item.subtotal);
                    existing.taxAmount += parseFloat(item.taxAmount);
                    existing.lineTotal += parseFloat(item.lineTotal);
                } else {
                    itemsMap.set(key, {
                        drugId: item.drugId,
                        drugName: item.drug.name,
                        batchNumber: item.batchNumber,
                        totalQuantity: item.quantityReceived,
                        unit: item.unit || 'units',
                        unitPrice: parseFloat(item.unitPrice),
                        gstPercent: parseFloat(item.gstPercent),
                        discountPercent: parseFloat(item.discountPercent || 0),
                        subtotal: parseFloat(item.subtotal),
                        taxAmount: parseFloat(item.taxAmount),
                        lineTotal: parseFloat(item.lineTotal),
                    });
                }
            });
        });

        const items = Array.from(itemsMap.values());

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber(storeId);

        // Create invoice with items and GRN links
        const invoice = await prisma.consolidatedInvoice.create({
            data: {
                invoiceNumber,
                storeId,
                supplierId,
                invoiceDate: new Date(),
                periodStart: periodStart ? new Date(periodStart) : null,
                periodEnd: periodEnd ? new Date(periodEnd) : null,
                subtotal,
                taxAmount,
                total,
                type: type || 'SINGLE_SUPPLIER',
                status: 'DRAFT',
                notes,
                createdBy: userId,
                items: {
                    create: items
                },
                grns: {
                    create: grnIds.map(grnId => ({ grnId }))
                }
            },
            include: {
                supplier: true,
                items: true,
                grns: {
                    include: {
                        grn: {
                            select: {
                                grnNumber: true,
                                receivedDate: true,
                                supplierInvoiceNo: true,
                            }
                        }
                    }
                }
            }
        });

        return invoice;
    }

    /**
     * Get consolidated invoice by ID
     */
    async getById(id, storeId) {
        return await prisma.consolidatedInvoice.findFirst({
            where: { id, storeId },
            include: {
                supplier: true,
                store: {
                    select: {
                        name: true,
                        displayName: true,
                        addressLine1: true,
                        addressLine2: true,
                        city: true,
                        state: true,
                        pinCode: true,
                        phoneNumber: true,
                        email: true,
                        gstin: true,
                        dlNumber: true,
                    }
                },
                items: true,
                grns: {
                    include: {
                        grn: {
                            select: {
                                grnNumber: true,
                                receivedDate: true,
                                supplierInvoiceNo: true,
                                supplierInvoiceDate: true,
                            }
                        }
                    }
                },
                createdByUser: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            }
        });
    }

    /**
     * List all consolidated invoices
     */
    async list(storeId, filters = {}) {
        const { page = 1, limit = 50, status, supplierId, startDate, endDate, search } = filters;

        const where = {
            storeId,
        };

        if (status) {
            where.status = status;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (startDate || endDate) {
            where.invoiceDate = {};
            if (startDate) where.invoiceDate.gte = new Date(startDate);
            if (endDate) where.invoiceDate.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { notes: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.consolidatedInvoice.findMany({
                where,
                include: {
                    supplier: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    grns: {
                        select: {
                            id: true,
                        }
                    },
                    items: {
                        select: {
                            id: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.consolidatedInvoice.count({ where })
        ]);

        return {
            data: invoices.map(inv => ({
                ...inv,
                grnsCount: inv.grns.length,
                itemsCount: inv.items.length,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Update invoice status
     */
    async updateStatus(id, storeId, status) {
        return await prisma.consolidatedInvoice.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Delete invoice
     */
    async delete(id, storeId) {
        return await prisma.consolidatedInvoice.delete({
            where: { id },
        });
    }
}

module.exports = new ConsolidatedInvoiceRepository();
