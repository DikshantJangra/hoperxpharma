const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

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
        // DEBUG: Log incoming payload
        try {
            const fs = require('fs');
            fs.appendFileSync('/tmp/sale_repo_debug.log', `[${new Date().toISOString()}] createSale called. PrescID: ${saleData.prescriptionId}, CreateRefill: ${saleData.shouldCreateRefill}\nJSON: ${JSON.stringify(saleData)}\n`);
        } catch (e) { console.error('Log failed', e); }

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

                // CONDITIONAL: Handle Refill Updates
                // Note: Creation of NEW refills is handled at the end by _processRefillUpdates
                // Legacy block removed to rely on unified logic

                // Create sale
                // FIX: Extract non-DB fields to prevent Prisma error
                const { shouldCreateRefill, ...saleDataForDB } = saleData;

                const sale = await tx.sale.create({
                    data: {
                        ...saleDataForDB,
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
                                data: {
                                    quantityInStock: { decrement: item.quantity }
                                }
                            }),
                            tx.stockMovement.create({
                                data: {
                                    // storeId removed as it's not in StockMovement model
                                    batchId: item.batchId,
                                    movementType: 'SALE',
                                    quantity: -item.quantity,
                                    referenceType: 'SALE', // Explicitly set referenceType
                                    referenceId: sale.invoiceNumber,
                                    userId: saleData.soldBy // Mapped from createdBy/soldBy
                                }
                            })
                        ]);
                    });

                    await Promise.all(inventoryPromises);
                }

                // 4. Process Refill Updates if linked to a prescription and requested
                if (saleData.prescriptionId && saleData.shouldCreateRefill) {
                    await this._processRefillUpdates(tx, sale.id, saleData.prescriptionId, items);
                }

                return { sale, items: [], payments: [] };
            }
        }, {
            maxWait: 20000,
            timeout: 20000
        });
    }

    /**
     * Process refill updates and prescription item tracking
     * @private
     */
    async _processRefillUpdates(tx, saleId, prescriptionId, saleItems) {
        const log = (msg) => fs.appendFileSync('/tmp/refill_debug.log', `[${new Date().toISOString()}] ${msg}\n`);
        try {
            log(`START processing refill for Sale ${saleId}, Rx ${prescriptionId}`);

            // 1. Fetch prescription with items to verify
            const prescription = await tx.prescription.findUnique({
                where: { id: prescriptionId },
                include: {
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        take: 1,
                        include: { items: true }
                    }
                }
            });

            if (!prescription) {
                log(`ERROR: Prescription ${prescriptionId} not found`);
                return;
            }
            log(`Prescription found. Versions: ${prescription.versions?.length}`);

            // Flatten items from latest version
            const prescriptionItems = prescription.versions?.[0]?.items || [];
            log(`Prescription Items count: ${prescriptionItems.length}`);

            // 2. Identify items that match the prescription
            // We need to match sale items to prescription items (by drugId)
            const matchedItems = [];

            for (const soldItem of saleItems) {
                log(`Checking sold item drugId: ${soldItem.drugId}`);
                // Find matching prescription item
                const rxItem = prescriptionItems.find(ri => ri.drugId === soldItem.drugId);

                if (rxItem) {
                    log(`MATCH FOUND: RxItem ID ${rxItem.id} for Drug ${soldItem.drugId}`);
                    matchedItems.push({
                        rxItem,
                        soldQty: soldItem.quantity
                    });
                } else {
                    log(`NO MATCH for Drug ${soldItem.drugId}`);
                }
            }

            if (matchedItems.length === 0) {
                log('No matched items found. Exiting.');
                return;
            }

            // 3. Create a new Refill Record
            // Determine next refill number
            const lastRefill = await tx.refill.findFirst({
                where: { prescriptionId },
                orderBy: { refillNumber: 'desc' },
                select: { refillNumber: true }
            });

            const nextRefillNumber = (lastRefill?.refillNumber || 0) + 1;
            log(`Creating Refill #${nextRefillNumber}`);

            // Create the Refill entry
            const refillQty = matchedItems.reduce((sum, m) => sum + m.soldQty, 0);

            const refill = await tx.refill.create({
                data: {
                    prescriptionId,
                    refillNumber: nextRefillNumber,
                    authorizedQty: refillQty,
                    dispensedQty: refillQty,
                    remainingQty: 0,
                    status: 'FULLY_USED',
                    notes: `Dispensed via Sale #${sale.invoiceNumber || saleId}`,
                }
            });
            log(`Refill created with ID: ${refill.id}, Qty: ${refillQty}`);

            // Create RefillItems explicitly using createMany
            if (matchedItems.length > 0) {
                await tx.refillItem.createMany({
                    data: matchedItems.map(m => ({
                        refillId: refill.id,
                        prescriptionItemId: m.rxItem.id,
                        quantityDispensed: m.soldQty,
                        dispensedAt: new Date()
                    }))
                });
            }

            // 4. Update Prescription Items "quantityUsed"
            // This is crucial for "Remaining" calculations in frontend
            for (const match of matchedItems) {
                await tx.prescriptionItem.update({
                    where: { id: match.rxItem.id },
                    data: {
                        quantityUsed: { increment: match.soldQty }
                    }
                });
            }

            // 5. Create Audit Log
            await tx.auditLog.create({
                data: {
                    userId: 'SYSTEM', // or pass in userId from sale
                    storeId: prescription.storeId || null, // Context might be needed
                    action: 'REFILL_DISPENSE',
                    entityType: 'Refill',
                    entityId: refill.id,
                    changes: {
                        refillNumber: nextRefillNumber,
                        status: 'FULLY_USED',
                        dispensedMedications: matchedItems.map(m => ({ drugId: m.rxItem.drugId, quantity: m.soldQty })),
                        saleId: saleId
                    }
                }
            });

            log(`✅ SUCCESS: Refill #${nextRefillNumber} process completed`);

        } catch (error) {
            console.error("Failed to process refill updates:", error);
            // Don't block the sale if refill logic fails, but log it
            // throw error; // Uncomment if we want strict consistency
        }
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
