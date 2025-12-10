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

            // Calculate total credit amount used in this sale
            const creditPayment = paymentSplits.find(p => p.paymentMethod === 'CREDIT');
            const creditAmount = creditPayment ? parseFloat(creditPayment.amount) : 0;

            // Set initial balance and status
            let saleBalance = 0;
            let paymentStatus = 'PAID'; // Default for fully paid

            if (creditAmount > 0) {
                saleBalance = creditAmount;
                paymentStatus = 'UNPAID';
                // If there were other payments (e.g. partial cash), status might be PARTIAL essentially,
                // but for simplified tracking, if there is ANY credit, it is UNPAID/PARTIAL depending on logic.
                // Let's stick to UNPAID if full credit, or PARTIAL if mixed.
                const totalAmount = parseFloat(sale.total);
                if (creditAmount < totalAmount) {
                    paymentStatus = 'PARTIAL';
                }
            }

            // Update Sale with balance info (if credit used)
            if (creditAmount > 0) {
                await tx.sale.update({
                    where: { id: sale.id },
                    data: {
                        balance: creditAmount,
                        paymentStatus: paymentStatus
                    }
                });
            }

            if (creditAmount > 0) {
                if (!saleData.patientId) {
                    throw new Error("Customer is required for Credit/Pay Later sales.");
                }

                // 1. Update Patient Balance (Increase Debt)
                const updatedPatient = await tx.patient.update({
                    where: { id: saleData.patientId },
                    data: {
                        currentBalance: {
                            increment: creditAmount
                        }
                    }
                });

                // 2. Add to Ledger
                await tx.customerLedger.create({
                    data: {
                        storeId: saleData.storeId,
                        patientId: saleData.patientId,
                        type: 'DEBIT', // Increasing debt
                        amount: creditAmount,
                        balanceAfter: updatedPatient.currentBalance,
                        referenceType: 'SALE',
                        referenceId: sale.id,
                        notes: `Credit Sale Invoice: ${saleData.invoiceNumber}`
                    }
                });
            }

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
        // 1. Get Store Settings for format
        const settings = await prisma.storeSettings.findUnique({
            where: { storeId }
        });

        const format = settings?.invoiceFormat || 'INV/{YYYY}/{SEQ:4}';

        // 2. Parse tokens
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        // Create a regex to match the sequence part, e.g., {SEQ:4} or {SEQ}
        // Base prefix without the sequence number
        let prefix = format
            .replace('{YYYY}', year)
            .replace('{MM}', month)
            .replace('{DD}', day);

        // Extract sequence length
        let seqLength = 4;
        const seqMatch = prefix.match(/{SEQ(?::(\d+))?}/);

        // Remove the SEQ token to get the searchable prefix for DB
        // Note: This is a simplification. If SEQ is in the middle, this logic might need adjustment.
        // Assuming SEQ is usually at the end or we can find the "last used" matching the pattern.
        // Better approach: Find the last sale that matches the static parts of the format.

        if (seqMatch) {
            seqLength = seqMatch[1] ? parseInt(seqMatch[1]) : 4;
            // Remove the total SEQ token from prefix for the "startsWith" check? 
            // Actually, if format is INV/{YYYY}/{SEQ}, prefix becomes INV/2025/{SEQ}
            // We need to split into "before SEQ" and "after SEQ" to find matches?
            // For MVP simplicity, let's assume SEQ is at the end or we just look for current Year/Month based sequences.

            // Let's use a cleaner approach:
            // 1. Replace date tokens.
            // 2. Identify the SEQ token position.

            prefix = prefix.replace(seqMatch[0], ''); // Remove {SEQ...} to get the base
        }

        // Find last sale starting with this prefix
        // This assumes {SEQ} is at the end. If {SEQ} is in middle, "startsWith" might fail if suffix exists.
        // But "startsWith" is robust enough for standard "INV-2025-001" formats.

        const lastSale = await prisma.sale.findFirst({
            where: {
                storeId,
                invoiceNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let nextSeq = 1;
        if (lastSale) {
            // Extract the number part from the end (or valid part)
            // If prefix is "INV/2025/", and last is "INV/2025/0045"
            // We strip prefix and parse remainder.
            const remainder = lastSale.invoiceNumber.replace(prefix, '');
            // Attempt to parse remainder as int
            const parsed = parseInt(remainder);
            if (!isNaN(parsed)) {
                nextSeq = parsed + 1;
            }
        }

        // Reconstruct full string
        // We need to go back to the format string with date tokens replaced, effectively 'formattedTemplate'
        let formattedTemplate = format
            .replace('{YYYY}', year)
            .replace('{MM}', month)
            .replace('{DD}', day);

        // Replace {SEQ...} with the actual number
        const seqString = String(nextSeq).padStart(seqLength, '0');
        // Use a global replace or the specific match we found earlier
        return formattedTemplate.replace(/{SEQ(?::(\d+))?}/, seqString);
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
    /**
     * Get unpaid invoices for a customer
     */
    async getUnpaidInvoices(patientId) {
        return await prisma.sale.findMany({
            where: {
                patientId,
                paymentStatus: {
                    in: ['UNPAID', 'PARTIAL', 'OVERDUE']
                },
                balance: {
                    gt: 0
                },
                deletedAt: null
            },
            orderBy: {
                createdAt: 'asc' // Oldest first
            },
            select: {
                id: true,
                invoiceNumber: true,
                createdAt: true,
                total: true,
                balance: true,
                paymentStatus: true
            }
        });
    }
}

module.exports = new SaleRepository();
