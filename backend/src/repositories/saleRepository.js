const database = require('../config/database');

const prisma = database.getClient();

/**
 * Sale Repository - Data access layer for sales operations
 */
class SaleRepository {
    /**
     * Find sales with pagination
     */
    async findSales({ storeId, page = 1, limit = 20, patientId, startDate, endDate }) {
        const skip = (page - 1) * limit;
        const take = parseInt(limit, 10); // Convert to integer for Prisma

        const where = {
            storeId,
            deletedAt: null,
            ...(patientId && { patientId }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
        };

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                skip,
                take,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                        },
                    },
                    items: {
                        include: {
                            drug: true,
                            batch: true,
                        },
                    },
                    paymentSplits: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.sale.count({ where }),
        ]);

        return { sales, total };
    }

    /**
     * Find sale by ID
     */
    async findById(id) {
        return await prisma.sale.findUnique({
            where: { id, deletedAt: null },
            include: {
                patient: true,
                store: true, // Fix: Include store details
                items: {
                    include: {
                        drug: true,
                        batch: true,
                    },
                },
                paymentSplits: true,
            },
        });
    }

    /**
     * Find sale by invoice number
     */
    async findByInvoiceNumber(invoiceNumber) {
        return await prisma.sale.findUnique({
            where: { invoiceNumber },
        });
    }

    /**
     * Create sale with items and payments (transaction)
     */
    async createSale(saleData, items, paymentSplits) {
        return await prisma.$transaction(async (tx) => {
            // If prescription ID is linked, fetch it to get attachments
            let attachments = [];
            if (saleData.prescriptionId) {
                const rx = await tx.prescription.findUnique({
                    where: { id: saleData.prescriptionId },
                    include: { files: true }
                });

                if (rx && rx.files && rx.files.length > 0) {
                    attachments = rx.files.map(f => ({
                        name: 'Prescription Attachment',
                        url: f.url,
                        type: f.fileType || 'image'
                    }));
                }

                // Update Prescription Status
                await tx.prescription.update({
                    where: { id: saleData.prescriptionId },
                    data: {
                        status: 'COMPLETED',
                        stage: 'DELIVERED', // or 'DISPENSED'
                        updatedAt: new Date()
                    }
                });
            }

            // Create sale
            const sale = await tx.sale.create({
                data: {
                    ...saleData,
                    attachments: attachments.length > 0 ? attachments : undefined
                },
            });

            /* 
            // Previous code block removed:
            // If prescription ID is linked, update its status
            if (saleData.prescriptionId) { ... } 
            */

            // Create sale items
            const saleItems = await Promise.all(
                items.map((item) =>
                    tx.saleItem.create({
                        data: {
                            ...item,
                            saleId: sale.id,
                        },
                    })
                )
            );

            // Create payment splits
            const payments = await Promise.all(
                paymentSplits.map((payment) =>
                    tx.paymentSplit.create({
                        data: {
                            ...payment,
                            saleId: sale.id,
                        },
                    })
                )
            );

            // Update inventory and create stock movements (SKIP for ESTIMATES)
            if (saleData.invoiceType !== 'ESTIMATE') {
                for (const item of items) {
                    // Deduct from batch
                    await tx.inventoryBatch.update({
                        where: { id: item.batchId },
                        data: {
                            quantityInStock: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    // Create stock movement
                    await tx.stockMovement.create({
                        data: {
                            batchId: item.batchId,
                            movementType: 'OUT',
                            quantity: item.quantity,
                            reason: 'Sale',
                            referenceType: 'sale',
                            referenceId: sale.id,
                        },
                    });
                }
            } // End of ESTIMATE check

            return { sale, items: saleItems, payments };
        });
    }

    /**
     * Generate invoice number
     */
    async generateInvoiceNumber(storeId) {
        const today = new Date();
        const prefix = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

        const lastSale = await prisma.sale.findFirst({
            where: {
                storeId,
                invoiceNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastSale) {
            const lastSequence = parseInt(lastSale.invoiceNumber.slice(-4));
            sequence = lastSequence + 1;
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }

    /**
     * Get sales statistics
     */
    /**
     * Helper to serialize BigInt
     */
    _serializeBigInt(obj) {
        return JSON.parse(JSON.stringify(obj, (key, value) =>
            typeof value === 'bigint' ? Number(value) : value
        ));
    }

    /**
     * Get sales statistics
     */
    async getSalesStats(storeId, startDate, endDate) {
        const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int as "totalSales",
        COALESCE(SUM("total"), 0)::float as "totalRevenue",
        COALESCE(AVG("total"), 0)::float as "averageOrderValue",
        COALESCE(SUM("discountAmount"), 0)::float as "totalDiscount"
      FROM "Sale"
      WHERE "storeId" = ${storeId}
        AND "deletedAt" IS NULL
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
    `;

        return result[0];
    }

    /**
     * Get top selling drugs
     */
    async getTopSellingDrugs(storeId, limit = 10) {
        const result = await prisma.$queryRaw`
      SELECT 
        d.id,
        d.name,
        d.strength,
        d.form,
        COALESCE(SUM(si.quantity), 0)::int as "totalQuantity",
        COALESCE(SUM(si."lineTotal"), 0)::float as "totalRevenue",
        COUNT(DISTINCT s.id)::int as "salesCount"
      FROM "SaleItem" si
      INNER JOIN "Sale" s ON s.id = si."saleId"
      INNER JOIN "Drug" d ON d.id = si."drugId"
      WHERE s."storeId" = ${storeId}
        AND s."deletedAt" IS NULL
        AND s."createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY d.id, d.name, d.strength, d.form
      ORDER BY "totalQuantity" DESC
      LIMIT ${limit}
    `;

        return result;
    }
}

module.exports = new SaleRepository();
