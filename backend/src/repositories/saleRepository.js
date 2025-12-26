const database = require('../config/database');

const prisma = database.getClient();

/**
 * Sale Repository - Data access layer for sales operations
 */
class SaleRepository {
    /**
     * Find sales with pagination
     */
    async findSales({ storeId, page = 1, limit = 20, patientId, startDate, endDate, paymentMethod, invoiceType, paymentStatus, hasPrescription, sortBy = 'createdAt', sortOrder = 'desc' }) {
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
            ...(paymentMethod && paymentMethod !== 'all' && {
                paymentSplits: {
                    some: {
                        paymentMethod: paymentMethod.toUpperCase()
                    }
                }
            }),
            ...(invoiceType && invoiceType !== 'all' && {
                invoiceType: invoiceType === 'gst' ? 'GST_INVOICE' :
                    invoiceType === 'credit' ? 'CREDIT_NOTE' :
                        'REGULAR_INVOICE'
            }),
            ...(paymentStatus && paymentStatus !== 'all' && {
                paymentStatus: paymentStatus.toUpperCase()
            }),
            ...(hasPrescription !== undefined && {
                prescriptionId: hasPrescription === 'true' || hasPrescription === true ? { not: null } : null
            }),
        };

        // Build orderBy based on sortBy field
        let orderBy = {};
        if (sortBy === 'amount') {
            orderBy = { total: sortOrder };
        } else if (sortBy === 'invoice') {
            orderBy = { invoiceNumber: sortOrder };
        } else {
            orderBy = { createdAt: sortOrder };
        }

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
                    dispenseForPatient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                        },
                    },
                    prescription: {
                        select: {
                            id: true,
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
                orderBy,
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
                dispenseForPatient: true,
                store: {
                    include: {
                        settings: true // Include settings which contains invoiceFormat and footerText
                    }
                },
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
            let attachments = [];

            // Optimize: Only fetch prescription if it exists (single query with minimal fields)
            if (saleData.prescriptionId) {
                const rx = await tx.prescription.findUnique({
                    where: { id: saleData.prescriptionId },
                    select: {
                        id: true,
                        files: { select: { fileUrl: true } }
                    }
                });

                if (rx?.files?.length > 0) {
                    attachments = rx.files.map(f => ({
                        name: 'Prescription',
                        url: f.fileUrl,
                        type: 'image'
                    }));
                }

                // Update prescription status (no await needed, will commit with transaction)
                tx.prescription.update({
                    where: { id: saleData.prescriptionId },
                    data: { status: 'COMPLETED', updatedAt: new Date() }
                });

                // Update RefillItems for medications actually dispensed
                // Find the most recent AVAILABLE refill for this prescription
                const activeRefill = await tx.refill.findFirst({
                    where: {
                        prescriptionId: saleData.prescriptionId,
                        status: { in: ['AVAILABLE', 'PARTIALLY_USED'] }
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        items: {
                            include: {
                                prescriptionItem: {
                                    select: { drugId: true }
                                }
                            }
                        }
                    }
                });

                if (activeRefill && activeRefill.items.length > 0) {
                    // Build map of drugId to refillItem for fast lookup
                    const drugToRefillItem = new Map();
                    activeRefill.items.forEach(ri => {
                        if (ri.prescriptionItem?.drugId) {
                            drugToRefillItem.set(ri.prescriptionItem.drugId, ri);
                        }
                    });

                    // Batch update RefillItems
                    const updatePromises = items.map(saleItem => {
                        const refillItem = drugToRefillItem.get(saleItem.drugId);
                        if (refillItem && !refillItem.dispensedAt) {
                            return tx.refillItem.update({
                                where: { id: refillItem.id },
                                data: {
                                    quantityDispensed: saleItem.quantity,
                                    dispensedAt: new Date()
                                }
                            });
                        }
                        return null;
                    }).filter(Boolean);

                    await Promise.all(updatePromises);

                    // Check completion and update Refill status
                    const updatedRefillItems = await tx.refillItem.findMany({
                        where: { refillId: activeRefill.id },
                        select: { dispensedAt: true }
                    });

                    const allDispensed = updatedRefillItems.every(item => item.dispensedAt !== null);
                    const anyDispensed = updatedRefillItems.some(item => item.dispensedAt !== null);

                    const newRefillStatus = allDispensed ? 'FULLY_USED'
                        : anyDispensed ? 'PARTIALLY_USED'
                            : 'AVAILABLE';

                    await tx.refill.update({
                        where: { id: activeRefill.id },
                        data: { status: newRefillStatus }
                    });

                    // Create audit log for refill dispensing
                    await tx.auditLog.create({
                        data: {
                            userId: saleData.soldBy,
                            storeId: saleData.storeId,
                            action: 'REFILL_DISPENSE',
                            entityType: 'Refill',
                            entityId: activeRefill.id,
                            changes: {
                                refillNumber: activeRefill.refillNumber,
                                status: newRefillStatus,
                                dispensedMedications: items.map(i => ({ drugId: i.drugId, quantity: i.quantity })),
                                saleId: null // Will be updated after sale creation
                            }
                        }
                    });
                }
            }

            // Create sale
            const sale = await tx.sale.create({
                data: {
                    ...saleData,
                    attachments: attachments.length > 0 ? attachments : undefined
                },
            });

            // Batch create sale items (parallel)
            const saleItemsPromise = tx.saleItem.createMany({
                data: items.map(item => ({ ...item, saleId: sale.id }))
            });

            // Batch create payment splits (parallel)
            const paymentsPromise = tx.paymentSplit.createMany({
                data: paymentSplits.map(payment => ({ ...payment, saleId: sale.id }))
            });

            // Wait for both
            await Promise.all([saleItemsPromise, paymentsPromise]);

            // Handle credit payments
            const creditPayment = paymentSplits.find(p => p.paymentMethod?.toUpperCase() === 'CREDIT');
            const creditAmount = creditPayment ? parseFloat(creditPayment.amount) : 0;

            if (creditAmount > 0) {
                if (!saleData.patientId) {
                    throw new Error("Customer required for credit sales");
                }

                const totalAmount = parseFloat(sale.total);
                const paymentStatus = creditAmount < totalAmount ? 'PARTIAL' : 'UNPAID';

                // Update sale balance
                await tx.sale.update({
                    where: { id: sale.id },
                    data: { balance: creditAmount, paymentStatus }
                });

                // Update patient balance and create ledger entry (parallel)
                const updatedPatient = await tx.patient.update({
                    where: { id: saleData.patientId },
                    data: { currentBalance: { increment: creditAmount } }
                });

                tx.customerLedger.create({
                    data: {
                        storeId: saleData.storeId,
                        patientId: saleData.patientId,
                        type: 'DEBIT',
                        amount: creditAmount,
                        balanceAfter: updatedPatient.currentBalance,
                        referenceType: 'SALE',
                        referenceId: sale.id,
                        notes: `Credit Sale: ${saleData.invoiceNumber}`
                    }
                });
            }

            // Update inventory (skip for estimates)
            if (saleData.invoiceType !== 'ESTIMATE') {
                // Batch update inventory and create stock movements
                const inventoryPromises = items.map(async (item) => {
                    const currentBatch = await tx.inventoryBatch.findUnique({
                        where: { id: item.batchId },
                        select: { quantityInStock: true, batchNumber: true, drug: { select: { name: true } } }
                    });

                    if (!currentBatch || currentBatch.quantityInStock < item.quantity) {
                        throw new Error(
                            `Insufficient stock for ${currentBatch?.drug.name || 'item'} (Batch: ${currentBatch?.batchNumber})`
                        );
                    }

                    // Update batch and create movement (parallel)
                    return Promise.all([
                        tx.inventoryBatch.update({
                            where: { id: item.batchId },
                            data: { quantityInStock: { decrement: item.quantity } }
                        }),
                        tx.stockMovement.create({
                            data: {
                                batchId: item.batchId,
                                movementType: 'OUT',
                                quantity: item.quantity,
                                reason: 'Sale',
                                referenceType: 'sale',
                                referenceId: sale.id
                            }
                        })
                    ]);
                });

                await Promise.all(inventoryPromises);
            }

            return { sale, items: [], payments: [] };
        }, {
            maxWait: 8000,
            timeout: 8000
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
