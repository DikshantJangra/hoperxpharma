const prisma = require('../db/prisma');
const logger = require('../config/logger');

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
                            email: true, // Added for Email Invoice feature
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
                            notes: true, // Identify "Quick Sale" auto-generated prescriptions (was instructions)
                        },
                    },
                    items: {
                        include: {
                            drug: true,
                            batch: true,
                        },
                    },
                    paymentSplits: true,
                    refunds: {
                        include: {
                            items: true,
                            creditNote: true,
                        },
                    },
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
                refunds: {
                    include: {
                        items: true,
                        creditNote: true,
                    },
                },
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
        // Log incoming payload with proper logger
        logger.debug('createSale called', {
            prescriptionId: saleData.prescriptionId,
            shouldCreateRefill: saleData.shouldCreateRefill,
            storeId: saleData.storeId,
            total: saleData.total
        });

        const TRANSACTION_TIMEOUT = parseInt(process.env.TRANSACTION_TIMEOUT) || 60000; // Increased to 60s
        const TRANSACTION_MAX_WAIT = parseInt(process.env.TRANSACTION_MAX_WAIT) || 60000; // Increased to 60s

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

                // Calculate remaining refills to determine status
                const refillCount = await tx.refill.count({
                    where: { prescriptionId: saleData.prescriptionId }
                });
                // Assuming typical max refill logic or fetch from prescription if available.
                // For now, simpler: If we just created a refill (via shouldCreateRefill), keep ACTIVE.
                // If this is a one-time fill or last refill, mark COMPLETED.

                // BETTER: Just set to ACTIVE by default if it was Verified.
                // Only mark COMPLETED if 0 refills left (logic handled in future cleanup).
                // For safety, let's keep it ACTIVE if this is a Refill creation flow.
                const nextStatus = saleData.shouldCreateRefill ? 'ACTIVE' : 'COMPLETED';

                // Update prescription status
                tx.prescription.update({
                    where: { id: saleData.prescriptionId },
                    data: { status: nextStatus, updatedAt: new Date() }
                });

            }

            // Create sale (for both prescription and walk-in sales)
            // FIX: Extract non-DB fields to prevent Prisma error
            const { shouldCreateRefill, itemPrices, batches, ...saleDataForDB } = saleData;

            const sale = await tx.sale.create({
                data: {
                    ...saleDataForDB,
                    roundOff: saleDataForDB.roundOff || 0, // Ensure roundOff is always set
                    attachments: attachments.length > 0 ? attachments : undefined,
                    expectedPaymentDate: saleData.expectedPaymentDate ? new Date(saleData.expectedPaymentDate) : undefined
                },
            });

            // Batch create sale items (parallel)
            // NOTE: createMany only accepts flat scalar data, not relations
            // Strip out relation objects (drug, batch) that frontend may include
            const saleItemsPromise = tx.saleItem.createMany({
                data: items.map(item => ({
                    saleId: sale.id,
                    drugId: item.drugId,
                    batchId: item.batchId,
                    quantity: item.quantity,
                    mrp: item.mrp,
                    discount: item.discount || 0,
                    gstRate: item.gstRate || 0,
                    lineTotal: item.lineTotal,
                    hsnCode: item.hsnCode || null,
                    taxSlabId: item.taxSlabId || null,
                    taxableAmount: item.taxableAmount || 0,
                    cgstAmount: item.cgstAmount || 0,
                    sgstAmount: item.sgstAmount || 0,
                    igstAmount: item.igstAmount || 0,
                    cessAmount: item.cessAmount || 0,
                }))
            });

            // Batch create payment splits (parallel)
            const paymentsPromise = tx.paymentSplit.createMany({
                data: paymentSplits.map(payment => ({
                    saleId: sale.id,
                    paymentMethod: payment.method || payment.paymentMethod, // Support both field names
                    amount: payment.amount,
                    cardLast4: payment.cardLast4 || null,
                    cardBrand: payment.cardBrand || null,
                    cardAuthCode: payment.cardAuthCode || null
                }))
            });

            // Wait for both
            await Promise.all([saleItemsPromise, paymentsPromise]);

            // Handle credit payments
            const creditPayment = paymentSplits.find(p => (p.method || p.paymentMethod)?.toUpperCase() === 'CREDIT');
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

                await tx.customerLedger.create({
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

            // Handle Wallet payments (Redeeming Store Credit/Credit Notes)
            const walletPayment = paymentSplits.find(p => (p.method || p.paymentMethod)?.toUpperCase() === 'WALLET');
            const walletAmount = walletPayment ? parseFloat(walletPayment.amount) : 0;

            if (walletAmount > 0) {
                if (!saleData.patientId) {
                    throw new Error("Customer required for wallet payments");
                }

                // Fetch active credit notes for the patient
                const activeCreditNotes = await tx.creditNote.findMany({
                    where: {
                        issuedToId: saleData.patientId,
                        status: 'ACTIVE',
                        balance: { gt: 0 },
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    },
                    orderBy: { expiresAt: 'asc' } // Consume oldest/soonest to expire first
                });

                let remainingToCover = walletAmount;

                // Double check if enough balance exists (extra safety beyond frontend check)
                const totalAvailable = activeCreditNotes.reduce((sum, cn) => sum + Number(cn.balance), 0);
                if (totalAvailable < walletAmount) {
                    throw new Error(`Insufficient wallet balance. Available: ${totalAvailable}, Required: ${walletAmount}`);
                }

                for (const cn of activeCreditNotes) {
                    if (remainingToCover <= 0) break;

                    const cnBalance = Number(cn.balance);
                    const amountFromThisCN = Math.min(cnBalance, remainingToCover);

                    const newBalance = cnBalance - amountFromThisCN;
                    const newStatus = newBalance === 0 ? 'REDEEMED' : 'ACTIVE';

                    await tx.creditNote.update({
                        where: { id: cn.id },
                        data: {
                            balance: newBalance,
                            status: newStatus
                        }
                    });

                    // Log the redemption in CustomerLedger as a CREDIT to offset the sale's implicit debit
                    await tx.customerLedger.create({
                        data: {
                            storeId: saleData.storeId,
                            patientId: saleData.patientId,
                            type: 'CREDIT',
                            amount: amountFromThisCN,
                            balanceAfter: 0, // Wallet isn't part of currentBalance debt
                            referenceType: 'PAYMENT',
                            referenceId: sale.id,
                            notes: `Wallet Payment (CN: ${cn.code}) for Sale: ${saleData.invoiceNumber}`
                        }
                    });

                    remainingToCover -= amountFromThisCN;
                }

                logger.info(`[Wallet] Successfully redeemed ₹${walletAmount} from credit notes for patient ${saleData.patientId}`);
            }

            // Update inventory (skip for estimates)
            if (saleData.invoiceType !== 'ESTIMATE') {
                const salesUnitHelper = require('../services/sales/salesUnitConversionHelper');

                // Batch update inventory and create stock movements
                const inventoryPromises = items.map(async (item) => {
                    const currentBatch = await tx.inventoryBatch.findUnique({
                        where: { id: item.batchId },
                        select: {
                            baseUnitQuantity: true,
                            baseUnitQuantity: true,
                            batchNumber: true,
                            drugId: true,
                            drug: { select: { name: true, baseUnit: true } }
                        }
                    });

                    if (!currentBatch || currentBatch.baseUnitQuantity < item.quantity) {
                        throw new Error(
                            `Insufficient stock for ${currentBatch?.drug.name || 'item'} (Batch: ${currentBatch?.batchNumber})`
                        );
                    }

                    // Calculate base unit quantity for this sale item
                    let baseUnitQtyToDeduct = item.quantity; // Default 1:1
                    let saleUnit = item.unit || 'unit';

                    try {
                        const conversion = await salesUnitHelper.calculateSaleBaseUnitQty({
                            drugId: currentBatch.drugId,
                            quantity: item.quantity,
                            unit: item.unit || 'unit'
                        });

                        baseUnitQtyToDeduct = conversion.baseUnitQty;
                        saleUnit = conversion.unit;
                    } catch (error) {
                        // Fallback: use quantity as-is if no conversion configured
                        logger.warn(`Unit conversion fallback for sale item batch ${item.batchId}:`, error.message);
                    }

                    // Validate base unit availability
                    const availableBaseQty = currentBatch.baseUnitQuantity;
                    if (availableBaseQty < baseUnitQtyToDeduct) {
                        throw new Error(
                            `Insufficient base unit stock for ${currentBatch?.drug.name}. ` +
                            `Available: ${availableBaseQty} ${currentBatch.drug.baseUnit || 'units'}, ` +
                            `Required: ${baseUnitQtyToDeduct} ${currentBatch.drug.baseUnit || 'units'}`
                        );
                    }

                    // Update batch and create movement (parallel)
                    return Promise.all([
                        tx.inventoryBatch.update({
                            where: { id: item.batchId },
                            data: {
                                baseUnitQuantity: { decrement: baseUnitQtyToDeduct } // Truth
                            }
                        }),
                        tx.stockMovement.create({
                            data: {
                                batchId: item.batchId,
                                movementType: 'SALE',
                                quantity: -item.quantity, // Legacy field
                                baseUnitQuantity: -baseUnitQtyToDeduct, // New field
                                movementUnit: saleUnit, // Audit trail
                                originalQuantity: item.quantity, // Audit trail
                                referenceType: 'SALE',
                                referenceId: sale.invoiceNumber,
                                userId: saleData.soldBy
                            }
                        }),
                        // Update the sale item with base unit quantity for return tracking
                        tx.saleItem.updateMany({
                            where: {
                                saleId: sale.id,
                                drugId: currentBatch.drugId,
                                batchId: item.batchId
                            },
                            data: {
                                unit: saleUnit,
                                baseUnitQuantity: baseUnitQtyToDeduct
                            }
                        })
                    ]);
                });

                await Promise.all(inventoryPromises);
            }

            // 4. Process Refill Updates if linked to a prescription and requested
            if (saleData.prescriptionId && saleData.shouldCreateRefill) {
                await this._processRefillUpdates(tx, sale.id, saleData.prescriptionId, items, saleData.soldBy);
            }

            return { sale, items: [], payments: [] };
        }, {
            maxWait: TRANSACTION_MAX_WAIT,
            timeout: TRANSACTION_TIMEOUT,
            isolationLevel: 'ReadCommitted'
        });
    }

    /**
     * Process refill updates and prescription item tracking
     * @private
     */
    async _processRefillUpdates(tx, saleId, prescriptionId, saleItems, userId) {
        try {
            logger.debug('START processing refill', { saleId, prescriptionId });

            // 1. Fetch prescription with CANONICAL items (Required for FK)
            const prescription = await tx.prescription.findUnique({
                where: { id: prescriptionId },
                include: {
                    prescriptionItems: true, // Canonical Items (Target for RefillItem FK)
                    versions: {
                        orderBy: { versionNumber: 'desc' },
                        take: 1,
                        include: { items: true }
                    }
                }
            });

            if (!prescription) {
                logger.error('Prescription not found', { prescriptionId });
                return;
            }
            logger.debug('Prescription found', {
                prescriptionId,
                canonicalItemsCount: prescription.prescriptionItems?.length
            });

            // Use Canonical Items for RefillItem Creation (matches RefillItem_prescriptionItemId_fkey)
            const canonicalItems = prescription.prescriptionItems || [];

            // 2. Identify items from Sale that match the Prescription
            // We need to match sale items to prescription items (by drugId)
            const matchedItems = [];

            // Helper to get or create canonical item (Self-Healing)
            const getOrCreateCanonicalItem = async (drugId, soldItemQty) => {
                // 1. Try to find in loaded canonical items
                let canonical = canonicalItems.find(ri => ri.drugId == drugId);
                if (canonical) return canonical;

                // 2. If not found, try to find in DB directly (double check)
                canonical = await tx.prescriptionItem.findFirst({
                    where: { prescriptionId, drugId: String(drugId) } // Ensure String comparison
                });
                if (canonical) return canonical;

                // 3. If still not found, check if it exists in the LATEST VERSION (Ghost Item scenario)
                const versionItem = prescription.versions?.[0]?.items?.find(vi => vi.drugId == drugId);

                if (versionItem) {
                    logger.warn('REPAIR: Canonical PrescriptionItem missing, recreating from version', {
                        drugId,
                        prescriptionId
                    });
                    // Self-Heal: Create the missing PrescriptionItem
                    canonical = await tx.prescriptionItem.create({
                        data: {
                            prescriptionId,
                            drugId: String(drugId),
                            batchId: versionItem.batchId,
                            quantityPrescribed: versionItem.quantityPrescribed || soldItemQty, // Fallback to sold qty if missing
                            sig: versionItem.sig,
                            daysSupply: versionItem.daysSupply,
                            isControlled: versionItem.isControlled || false
                        }
                    });
                    logger.info('REPAIR SUCCESS: Created PrescriptionItem', {
                        prescriptionItemId: canonical.id,
                        drugId
                    });
                    return canonical;
                }

                return null;
            };

            for (const soldItem of saleItems) {
                logger.debug(`Checking sold item drugId: ${soldItem.drugId}`);

                // Use the self-healing helper
                const rxItem = await getOrCreateCanonicalItem(soldItem.drugId, soldItem.quantity);

                if (rxItem) {
                    logger.debug(`MATCH FOUND: RxItem ID ${rxItem.id} for Drug ${soldItem.drugId}`);
                    matchedItems.push({
                        rxItem, // This is now guaranteed to be a valid PrescriptionItem (Canonical)
                        soldQty: soldItem.quantity
                    });
                } else {
                    logger.debug(`NO MATCH for Drug ${soldItem.drugId} - Not in Prescription or Versions`);
                }
            }

            if (matchedItems.length === 0) {
                logger.debug('No matched items found for refill');
                return;
            }

            // 2b. VALIDATION: Check Status, Expiry, and Limits
            if (['CANCELLED', 'EXPIRED', 'DRAFT'].includes(prescription.status)) {
                throw new Error(`Cannot refill: Prescription is ${prescription.status}`);
            }
            if (prescription.expiryDate && new Date(prescription.expiryDate) < new Date()) {
                throw new Error(`Cannot refill: Prescription expired on ${new Date(prescription.expiryDate).toDateString()}`);
            }

            // Check Refill Limits for each matched item
            const latestVersion = prescription.versions?.[0];
            for (const m of matchedItems) {
                const versionItem = latestVersion?.items?.find(vi => vi.drugId == m.rxItem.drugId);
                const allowed = versionItem?.refillsAllowed || 0;

                const used = await tx.refillItem.count({
                    where: {
                        prescriptionItemId: m.rxItem.id,
                        dispensedAt: { not: null }
                    }
                });

                logger.debug(`Drug ${m.rxItem.drugId}: Used ${used} / Allowed ${allowed}`);

                if (used >= allowed) {
                    // Strict error to rollback transaction
                    throw new Error(`Refill limit reached for item (Used: ${used}/${allowed})`);
                }
            }

            // 3. Create a new Refill Record
            // Determine next refill number
            const lastRefill = await tx.refill.findFirst({
                where: { prescriptionId },
                orderBy: { refillNumber: 'desc' },
                select: { refillNumber: true }
            });

            const nextRefillNumber = (lastRefill?.refillNumber || 0) + 1;
            logger.debug(`Creating Refill #${nextRefillNumber}`);

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
                    notes: `Dispensed via Sale ID: ${saleId}`,
                }
            });
            logger.debug(`Refill created with ID: ${refill.id}, Qty: ${refillQty}`);

            // Create RefillItems explicitly using loop for safety and debug
            if (matchedItems.length > 0) {
                logger.debug(`Attempting to create ${matchedItems.length} RefillItems...`);
                let createdCount = 0;
                for (const m of matchedItems) {
                    try {
                        await tx.refillItem.create({
                            data: {
                                refillId: refill.id,
                                prescriptionItemId: m.rxItem.id, // Use Canonical ID
                                quantityDispensed: m.soldQty,
                                dispensedAt: new Date()
                            }
                        });
                        createdCount++;
                    } catch (e) {
                        logger.error(`ERROR creating RefillItem for RxItemId ${m.rxItem.id}: ${e.message}`);
                        // We re-throw to ensure the transaction rolls back if data is inconsistent
                        throw e;
                    }
                }
                logger.debug(`RefillItems created successfully! Count: ${createdCount}`);
            }

            // 4. Removed update of "quantityUsed" as column does not exist on PrescriptionItem table.
            // Usage should be calculated by summing RefillItems.

            // 5. Check if all refills are exhausted and update prescription status
            const totalRefillsAllowed = prescription.totalRefills || 0;
            const totalRefillsUsed = await tx.refill.count({
                where: {
                    prescriptionId,
                    status: { in: ['FULLY_USED', 'PARTIALLY_USED'] }
                }
            });

            logger.debug(`Refills status: ${totalRefillsUsed}/${totalRefillsAllowed}`);

            // Update prescription status to COMPLETED if all refills are used
            if (totalRefillsUsed >= totalRefillsAllowed && totalRefillsAllowed > 0) {
                await tx.prescription.update({
                    where: { id: prescriptionId },
                    data: { status: 'COMPLETED', updatedAt: new Date() }
                });
                logger.info('Prescription marked as COMPLETED - all refills exhausted', { prescriptionId });
            }

            // 6. Create Audit Log
            if (refill) {
                await tx.auditLog.create({
                    data: {
                        userId: userId,
                        storeId: prescription.storeId || null,
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

                // Also create audit log for prescription if status changed to COMPLETED
                if (totalRefillsUsed >= totalRefillsAllowed && totalRefillsAllowed > 0) {
                    await tx.auditLog.create({
                        data: {
                            userId: userId,
                            storeId: prescription.storeId || null,
                            action: 'PRESCRIPTION_COMPLETED',
                            entityType: 'Prescription',
                            entityId: prescriptionId,
                            changes: {
                                previousStatus: prescription.status,
                                newStatus: 'COMPLETED',
                                reason: 'All refills exhausted',
                                totalRefills: totalRefillsAllowed,
                                refillsUsed: totalRefillsUsed
                            }
                        }
                    });
                }
            }

            logger.info('Refill process completed successfully', {
                refillNumber: nextRefillNumber,
                prescriptionId
            });

        } catch (err) {
            logger.error('FATAL ERROR in _processRefillUpdates', {
                error: err.message,
                saleId,
                prescriptionId
            });
            throw err; // Ensure transaction rollback
        }
    }


    /**
     * Generate invoice number with retry logic for concurrent requests
     */
    async generateInvoiceNumber(storeId, maxRetries = 5) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const settings = await prisma.storeSettings.findUnique({
                    where: { storeId }
                });

                const format = settings?.invoiceFormat || 'INV-{YY}{MM}-{SEQ:4}';
                const now = new Date();
                const year = now.getFullYear().toString();
                const yearShort = year.slice(-2);
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');

                let prefix = format
                    .replace('{YYYY}', year)
                    .replace('{YY}', yearShort)
                    .replace('{MM}', month)
                    .replace('{DD}', day);

                let seqLength = 4;
                const seqMatch = prefix.match(/{SEQ(?::(\d+))?}/);

                if (seqMatch) {
                    seqLength = seqMatch[1] ? parseInt(seqMatch[1]) : 4;
                    prefix = prefix.replace(seqMatch[0], '');
                }

                // Use aggregation to get max sequence more efficiently
                const lastSale = await prisma.sale.findFirst({
                    where: {
                        storeId,
                        invoiceNumber: {
                            startsWith: prefix,
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { invoiceNumber: true }
                });

                let nextSeq = 1;
                if (lastSale) {
                    const remainder = lastSale.invoiceNumber.replace(prefix, '');
                    const parsed = parseInt(remainder);
                    if (!isNaN(parsed)) {
                        nextSeq = parsed + 1;
                    }
                }

                // Add random offset for concurrent requests (exponential backoff)
                if (attempt > 0) {
                    nextSeq += Math.floor(Math.random() * (attempt * 2)) + attempt;
                }

                let formattedTemplate = format
                    .replace('{YYYY}', year)
                    .replace('{YY}', yearShort)
                    .replace('{MM}', month)
                    .replace('{DD}', day);

                const seqString = String(nextSeq).padStart(seqLength, '0');
                const invoiceNumber = formattedTemplate.replace(/{SEQ(?::(\d+))?}/, seqString);

                // Quick existence check
                const existing = await prisma.sale.findUnique({
                    where: { invoiceNumber },
                    select: { id: true }
                });

                if (!existing) {
                    return invoiceNumber;
                }

                logger.warn(`Invoice number ${invoiceNumber} already exists, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 20 * attempt));
            } catch (error) {
                if (attempt === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 50 * attempt));
            }
        }

        // Fallback: use timestamp
        return `INV${Date.now()}`;
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
                paymentStatus: true,
                expectedPaymentDate: true
            }
        });
    }
}

module.exports = new SaleRepository();
