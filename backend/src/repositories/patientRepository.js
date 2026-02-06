const prisma = require('../db/prisma');
const logger = require('../config/logger');
const { buildOrderBy } = require('../utils/queryParser');
const { Prisma } = require('@prisma/client');

/**
 * Patient Repository - Data access layer for patient operations
 */
class PatientRepository {
    /**
     * Find patients with pagination and search
     */
    async findPatients({ storeId, page = 1, limit = 20, search = '', sortConfig }) {
        const skip = (page - 1) * limit;

        const where = {
            storeId,
            deletedAt: null,
            phoneNumber: { not: 'WALKIN-CUSTOMER' },
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { phoneNumber: { contains: search } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        // Build dynamic orderBy from sortConfig
        const orderBy = buildOrderBy(sortConfig, { createdAt: 'desc' });

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    phoneNumber: true,
                    email: true,
                    dateOfBirth: true,
                    gender: true,
                    createdAt: true,
                    lifecycleStage: true,
                    manualTrustLevel: true,
                    creditEnabled: true,
                    creditLimit: true,
                    currentBalance: true,
                    profileStrength: true,
                    lastVisitAt: true,
                },
            }),
            prisma.patient.count({ where }),
        ]);

        if (patients.length === 0) {
            return { patients, total };
        }

        const patientIds = patients.map(p => p.id);

        const aggregates = await prisma.$queryRaw`
            SELECT 
                "patientId",
                MAX("createdAt") as "lastVisitAt",
                MIN("createdAt") as "firstVisitAt",
                COUNT(*)::int as "visitCount",
                COALESCE(AVG("total"), 0)::float as "avgBill",
                SUM(CASE WHEN "paymentStatus" IN ('UNPAID','PARTIAL','OVERDUE') THEN 1 ELSE 0 END)::int as "lateCount"
            FROM "Sale"
            WHERE "patientId" IN (${Prisma.join(patientIds)})
              AND "deletedAt" IS NULL
            GROUP BY "patientId"
        `;

        const aggregateMap = new Map();
        for (const row of aggregates) {
            aggregateMap.set(row.patientId, {
                lastVisitAt: row.lastVisitAt,
                firstVisitAt: row.firstVisitAt,
                visitCount: Number(row.visitCount || 0),
                avgBill: Number(row.avgBill || 0),
                lateCount: Number(row.lateCount || 0),
            });
        }

        const enriched = patients.map(patient => {
            const agg = aggregateMap.get(patient.id) || {};
            return {
                ...patient,
                creditLimit: Number(patient.creditLimit || 0),
                currentBalance: Number(patient.currentBalance || 0),
                lastVisitAt: patient.lastVisitAt || agg.lastVisitAt || null,
                firstVisitAt: agg.firstVisitAt || null,
                visitCount: agg.visitCount || 0,
                avgBill: agg.avgBill || 0,
                lateCount: agg.lateCount || 0
            };
        });

        return { patients: enriched, total };
    }

    /**
     * Find patients with outstanding debt (Debtors)
     */
    async findDebtors({ storeId, page = 1, limit = 20, search = '', sortConfig }) {
        const skip = (page - 1) * limit;

        const where = {
            storeId,
            deletedAt: null,
            currentBalance: { gt: 0 }, // Only those who owe money
            phoneNumber: { not: 'WALKIN-CUSTOMER' },
            ...(search && {
                OR: [
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { phoneNumber: { contains: search } },
                ],
            }),
        };

        // Default sort by highest balance first
        const orderBy = sortConfig ? buildOrderBy(sortConfig) : { currentBalance: 'desc' };

        const [rawDebtors, total, totalOutstandingStats] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    email: true,
                    currentBalance: true,
                    creditLimit: true,
                    updatedAt: true,
                    sales: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: { createdAt: true }
                    }
                },
            }),
            prisma.patient.count({ where }),
            // Calculate total outstanding for the entire store (not just this page)
            prisma.patient.aggregate({
                where: {
                    storeId,
                    deletedAt: null,
                    currentBalance: { gt: 0 }
                },
                _sum: {
                    currentBalance: true
                },
                _count: {
                    id: true
                }
            })
        ]);

        // Convert Decimal fields to numbers for JSON serialization
        const debtors = rawDebtors.map(debtor => ({
            ...debtor,
            currentBalance: Number(debtor.currentBalance),
            creditLimit: Number(debtor.creditLimit)
        }));

        return {
            debtors,
            total,
            totalOutstanding: Number(totalOutstandingStats._sum.currentBalance || 0),
            totalDebtors: totalOutstandingStats._count.id || 0
        };
    }


    /**
     * Find patient by ID
     */
    async findById(id) {
        const patient = await prisma.patient.findUnique({
            where: { id, deletedAt: null },
            include: {
                consents: true,
                insurance: true,
                prescriptions: {
                    take: 5,
                    include: { prescriptionItems: { include: { drug: true } }, prescriber: true },
                    orderBy: { createdAt: 'desc' },
                },
                sales: {
                    take: 5,
                    include: { items: { include: { batch: { include: { drug: true } } } }, paymentSplits: true },
                    orderBy: { createdAt: 'desc' },
                },
                creditNotes: {
                    where: {
                        status: 'ACTIVE',
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    },
                },
            },
        });

        if (!patient) return null;

        // Convert Decimal fields to numbers for JSON serialization
        const walletBalance = patient.creditNotes
            ? patient.creditNotes.reduce((sum, cn) => sum + Number(cn.balance), 0)
            : 0;

        logger.info(`[PatientRepo] Calculated wallet balance for patient ${id}: ₹${walletBalance}`);

        return {
            ...patient,
            currentBalance: Number(patient.currentBalance),
            creditLimit: Number(patient.creditLimit),
            walletBalance: Number(walletBalance.toFixed(2))
        };
    }

    /**
     * Find patient by phone number
     */
    async findByPhoneNumber(storeId, phoneNumber) {
        return await prisma.patient.findFirst({
            where: {
                storeId,
                phoneNumber,
                deletedAt: null,
            },
        });
    }

    /**
     * Recalculate and update patient balance based on unpaid sales
     */
    async recalculatePatientBalance(patientId) {
        // Optional: Repair legacy data where balance might be 0 but status is UNPAID
        // This is a safety measure for migrated data.
        // We can check if any UNPAID sales have 0 balance and fix them? 
        // Or simply trust the aggregate. 
        // Let's assume the user wants the aggregate of current "valid" sales.

        const result = await prisma.sale.aggregate({
            where: {
                patientId,
                paymentStatus: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
                deletedAt: null
            },
            _sum: {
                balance: true
            }
        });

        const newBalance = Number(result._sum.balance || 0);

        const updatedPatient = await prisma.patient.update({
            where: { id: patientId },
            data: { currentBalance: newBalance }
        });

        // Convert Decimal to number for response
        return {
            ...updatedPatient,
            currentBalance: Number(updatedPatient.currentBalance),
            creditLimit: Number(updatedPatient.creditLimit)
        };
    }

    /**
     * Search patients (for autocomplete) - returns limited results
     */
    async searchPatients(storeId, query) {
        const patients = await prisma.patient.findMany({
            where: {
                storeId,
                deletedAt: null,
                phoneNumber: { not: 'WALKIN-CUSTOMER' },
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { phoneNumber: { contains: query } },
                ],
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                dateOfBirth: true,
                allergies: true,
                chronicConditions: true,
                lifecycleStage: true,
                manualTrustLevel: true,
                creditEnabled: true,
                creditLimit: true,
                currentBalance: true,
            },
            take: 10, // Limit to 10 results for autocomplete
            orderBy: { createdAt: 'desc' },
            include: {
                creditNotes: {
                    where: {
                        status: 'ACTIVE',
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                }
            }
        });

        // Add walletBalance to each patient
        return patients.map(p => {
            const walletBalance = p.creditNotes
                ? p.creditNotes.reduce((sum, cn) => sum + Number(cn.balance || 0), 0)
                : 0;
            return {
                ...p,
                walletBalance: Number(walletBalance.toFixed(2)),
                creditLimit: Number(p.creditLimit || 0),
                currentBalance: Number(p.currentBalance || 0)
            };
        });
    }

    /**
     * Create patient
     */
    async create(patientData) {
        return await prisma.patient.create({
            data: patientData,
        });
    }

    /**
     * Update patient
     */
    async update(id, patientData) {
        return await prisma.patient.update({
            where: { id },
            data: patientData,
        });
    }

    /**
     * Soft delete patient
     */
    async softDelete(id, deletedBy) {
        return await prisma.patient.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                deletedBy,
            },
        });
    }

    /**
     * Create patient consent
     */
    async createConsent(consentData) {
        return await prisma.patientConsent.create({
            data: consentData,
        });
    }

    /**
     * Update consent status
     */
    async updateConsent(id, status) {
        return await prisma.patientConsent.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Get patient consents
     */
    async getConsents(patientId) {
        return await prisma.patientConsent.findMany({
            where: { patientId },
            orderBy: { grantedDate: 'desc' },
        });
    }

    /**
     * Create patient insurance
     */
    async createInsurance(insuranceData) {
        return await prisma.patientInsurance.create({
            data: insuranceData,
        });
    }

    /**
     * Update patient insurance
     */
    async updateInsurance(id, insuranceData) {
        return await prisma.patientInsurance.update({
            where: { id },
            data: insuranceData,
        });
    }

    /**
     * Get patient statistics
     */
    async getPatientStats(storeId) {
        const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as "totalPatients",
        COUNT(CASE WHEN "createdAt" >= NOW() - INTERVAL '30 days' THEN 1 END) as "newPatientsThisMonth",
        COUNT(CASE WHEN UPPER("gender") = 'MALE' THEN 1 END) as "maleCount",
        COUNT(CASE WHEN UPPER("gender") = 'FEMALE' THEN 1 END) as "femaleCount"
      FROM "Patient"
      WHERE "storeId" = ${storeId}
        AND "deletedAt" IS NULL
    `;

        return result[0];
    }

    /**
     * Get patient history (aggregated timeline)
     */
    async getPatientHistory(patientId, { eventType = 'all', from, to } = {}) {
        const patient = await prisma.patient.findUnique({
            where: { id: patientId, deletedAt: null },
        });

        if (!patient) {
            return null;
        }

        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(to);

        const whereDate = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

        // Fetch all event types in parallel
        const [prescriptions, sales, consents, adherence] = await Promise.all([
            eventType === 'all' || eventType === 'prescription'
                ? prisma.prescription.findMany({
                    where: { patientId, ...whereDate },
                    include: { prescriber: true, prescriptionItems: { include: { drug: true } } },
                    orderBy: { createdAt: 'desc' },
                })
                : [],
            eventType === 'all' || eventType === 'sale'
                ? prisma.sale.findMany({
                    where: { patientId, ...whereDate },
                    include: {
                        items: { include: { batch: { include: { drug: true } } } },
                        paymentSplits: true
                    },
                    orderBy: { createdAt: 'desc' },
                })
                : [],
            eventType === 'all' || eventType === 'consent'
                ? prisma.patientConsent.findMany({
                    where: { patientId, ...whereDate },
                    orderBy: { grantedDate: 'desc' },
                })
                : [],
            eventType === 'all' || eventType === 'adherence'
                ? prisma.patientAdherence.findMany({
                    where: { patientId, ...whereDate },
                    orderBy: { createdAt: 'desc' },
                })
                : [],
        ]);

        return {
            patient,
            prescriptions,
            sales,
            consents,
            adherence,
        };
    }

    /**
     * Get refills due for a store
     */
    async getRefillsDue(storeId, { status = 'all', search = '', page = 1, limit = 100, sortConfig } = {}) {
        try {
            const today = new Date();
            const threeDaysFromNow = new Date(today);
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const skip = (page - 1) * limit;

            // Build where clause with database-level filtering
            const where = {
                patient: {
                    storeId,
                    deletedAt: null,
                    ...(search && {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { phoneNumber: { contains: search } },
                        ],
                    }),
                },
                actualRefillDate: null, // Not yet refilled
            };

            // Add date filtering based on status at database level
            if (status === 'overdue') {
                where.expectedRefillDate = { lt: today };
            } else if (status === 'due') {
                where.expectedRefillDate = { gte: today, lte: threeDaysFromNow };
            } else if (status === 'upcoming') {
                where.expectedRefillDate = { gt: threeDaysFromNow };
            }
            // If status === 'all', no date filter is added

            // Build dynamic orderBy
            const orderBy = buildOrderBy(sortConfig, { expectedRefillDate: 'asc' });

            const [adherenceRecords, total] = await Promise.all([
                prisma.patientAdherence.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phoneNumber: true,
                            },
                        },
                    },
                    orderBy,
                }),
                prisma.patientAdherence.count({ where }),
            ]);

            // Calculate status for each record (for display purposes)
            const refills = adherenceRecords.map((record) => {
                const expectedDate = new Date(record.expectedRefillDate);
                let refillStatus = 'upcoming';

                if (expectedDate < today) {
                    refillStatus = 'overdue';
                } else if (expectedDate <= threeDaysFromNow) {
                    refillStatus = 'due';
                }

                return {
                    ...record,
                    status: refillStatus,
                };
            });

            return { refills, total };
        } catch (error) {
            logger.error('Error fetching refills due:', error);
            // Return empty result instead of throwing error
            return { refills: [], total: 0 };
        }
    }

    /**
     * Create adherence record
     */
    async createAdherence(adherenceData) {
        return await prisma.patientAdherence.create({
            data: adherenceData,
        });
    }

    /**
     * Update adherence record (mark as refilled)
     */
    async updateAdherence(id, data) {
        return await prisma.patientAdherence.update({
            where: { id },
            data,
        });
    }

    /**
     * Get adherence records for a patient
     */
    async getAdherence(patientId) {
        return await prisma.patientAdherence.findMany({
            where: { patientId },
            orderBy: { expectedRefillDate: 'desc' },
        });
    }

    /**
     * Get adherence statistics for a patient
     */
    async getAdherenceStats(patientId) {
        const adherenceRecords = await prisma.patientAdherence.findMany({
            where: { patientId },
        });

        if (adherenceRecords.length === 0) {
            return {
                totalPrescriptions: 0,
                onTimeRefills: 0,
                lateRefills: 0,
                averageAdherenceRate: 0,
            };
        }

        const onTimeRefills = adherenceRecords.filter(
            (r) => r.actualRefillDate && r.actualRefillDate <= r.expectedRefillDate
        ).length;

        const lateRefills = adherenceRecords.filter(
            (r) => r.actualRefillDate && r.actualRefillDate > r.expectedRefillDate
        ).length;

        const averageAdherenceRate =
            adherenceRecords.reduce((sum, r) => sum + r.adherenceRate, 0) / adherenceRecords.length;

        return {
            totalPrescriptions: adherenceRecords.length,
            onTimeRefills,
            lateRefills,
            averageAdherenceRate: Math.round(averageAdherenceRate * 100) / 100,
        };
    }

    /**
     * Process refill transaction (atomic: create sale + decrement inventory + create adherence)
     */
    async processRefillTransaction(refillData) {
        const {
            patientId,
            storeId,
            prescriptionId,
            expectedRefillDate,
            adherenceRate,
            items,
            soldBy,
            paymentMethod,
        } = refillData;

        // Use Prisma transaction to ensure atomicity
        return await prisma.$transaction(async (tx) => {
            let sale = null;

            // Only create sale if items are provided
            if (items && items.length > 0) {
                // Calculate totals
                let subtotal = 0;
                let taxAmount = 0;
                const saleItems = [];

                for (const item of items) {
                    // Get batch details
                    const batch = await tx.inventoryBatch.findUnique({
                        where: { id: item.batchId },
                        include: { drug: true },
                    });

                    if (!batch) {
                        throw new Error(`Batch not found: ${item.batchId}`);
                    }

                    if (batch.baseUnitQuantity < item.quantity) {
                        throw new Error(
                            `Insufficient stock for ${batch.drug.name}. Available: ${batch.baseUnitQuantity}, Requested: ${item.quantity}`
                        );
                    }

                    // Calculate line total
                    const lineSubtotal = parseFloat(batch.mrp) * item.quantity;
                    const lineTax = (lineSubtotal * parseFloat(batch.drug.gstRate)) / 100;
                    const lineTotal = lineSubtotal + lineTax;

                    subtotal += lineSubtotal;
                    taxAmount += lineTax;

                    saleItems.push({
                        drugId: item.drugId,
                        batchId: item.batchId,
                        quantity: item.quantity,
                        mrp: batch.mrp,
                        discount: 0,
                        gstRate: batch.drug.gstRate,
                        lineTotal,
                    });

                    // Decrement inventory
                    await tx.inventoryBatch.update({
                        where: { id: item.batchId },
                        data: {
                            baseUnitQuantity: {
                                decrement: item.quantity,
                            },
                        },
                    });

                    // Create stock movement
                    await tx.stockMovement.create({
                        data: {
                            batchId: item.batchId,
                            movementType: 'OUT',
                            quantity: -item.quantity,
                            reason: 'Refill sale',
                            referenceType: 'refill',
                            referenceId: prescriptionId,
                        },
                    });
                }

                const total = subtotal + taxAmount;

                // Generate invoice number
                const invoiceCount = await tx.sale.count({
                    where: { storeId },
                });
                const invoiceNumber = `INV-${storeId.slice(0, 4)}-${String(invoiceCount + 1).padStart(6, '0')}`;

                // Create sale
                sale = await tx.sale.create({
                    data: {
                        storeId,
                        invoiceNumber,
                        patientId,
                        subtotal,
                        discountAmount: 0,
                        taxAmount,
                        roundOff: 0,
                        total,
                        soldBy,
                        items: {
                            create: saleItems,
                        },
                        paymentSplits: {
                            create: {
                                paymentMethod,
                                amount: total,
                            },
                        },
                    },
                    include: {
                        items: {
                            include: {
                                drug: true,
                                batch: true,
                            },
                        },
                    },
                });
            }

            // Create adherence record
            const adherence = await tx.patientAdherence.create({
                data: {
                    patientId,
                    prescriptionId,
                    expectedRefillDate,
                    actualRefillDate: new Date(),
                    adherenceRate,
                },
            });

            return {
                adherence,
                sale,
            };
        });
    }

    /**
     * Get all consents for a store (for consents page)
     */
    async getAllConsents(storeId, { status = 'all', page = 1, limit = 20, sortConfig } = {}) {
        const skip = (page - 1) * limit;

        const where = {
            patient: {
                storeId,
                deletedAt: null,
            },
            ...(status !== 'all' && { status }),
        };

        // Build dynamic orderBy
        const orderBy = buildOrderBy(sortConfig, { grantedDate: 'desc' });

        const [consents, total] = await Promise.all([
            prisma.patientConsent.findMany({
                where,
                skip,
                take: limit,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
                orderBy,
            }),
            prisma.patientConsent.count({ where }),
        ]);

        return { consents, total };
    }

    /**
     * Get patient ledger history (Unified View of all Purchases and Payments)
     */
    async getLedger({ patientId, storeId, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;
        const take = parseInt(limit);

        // We use a UNION to combine actual Sales (all purchases) 
        // with Ledger entries (payments, returns, adjustments)
        // This ensures the "History" tab shows everything the customer ever did.

        // Note: For Sales, we show the FULL total as a DEBIT.
        // For Ledger entries, we exclude 'SALE' reference types to avoid double-counting 
        // credit sales which were already captured by the Sales query part.

        const history = await prisma.$queryRaw`
            WITH combined AS (
                SELECT 
                    s.id, 
                    s."createdAt", 
                    'DEBIT' as "type", 
                    s."total"::float as amount, 
                    'SALE' as "referenceType", 
                    s."id" as "referenceId",
                    'Purchase: ' || s."invoiceNumber" || ' (' || (
                        SELECT COALESCE(STRING_AGG(d.name, ', '), 'Items') 
                        FROM "SaleItem" si 
                        JOIN "Drug" d ON d.id = si."drugId" 
                        WHERE si."saleId" = s.id
                    ) || ')' as notes,
                    s."createdAt" as sort_time
                FROM "Sale" s
                WHERE s."patientId" = ${patientId} 
                  AND s."deletedAt" IS NULL
                  AND (s."storeId" = ${storeId} OR ${storeId} IS NULL)
                
                UNION ALL
                
                SELECT 
                    id, 
                    "createdAt", 
                    "type"::text as "type", 
                    "amount"::float as amount, 
                    "referenceType"::text as "referenceType", 
                    "referenceId",
                    "notes",
                    "createdAt" as sort_time
                FROM "CustomerLedger"
                WHERE "patientId" = ${patientId} 
                  AND "referenceType" != 'SALE'
                  AND ("storeId" = ${storeId} OR ${storeId} IS NULL)
            )
            SELECT 
                id,
                "createdAt",
                type,
                amount,
                "referenceType",
                "referenceId",
                notes,
                SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE -amount END) 
                    OVER (ORDER BY sort_time ASC, id ASC)::float as "balanceAfter"
            FROM combined
            ORDER BY sort_time DESC, id DESC
            LIMIT ${take} OFFSET ${skip}
        `;

        // Get total count for pagination
        const totalCountRaw = await prisma.$queryRaw`
            SELECT (
                SELECT COUNT(*)::int FROM "Sale" WHERE "patientId" = ${patientId} AND "deletedAt" IS NULL AND ("storeId" = ${storeId} OR ${storeId} IS NULL)
            ) + (
                SELECT COUNT(*)::int FROM "CustomerLedger" WHERE "patientId" = ${patientId} AND "referenceType" != 'SALE' AND ("storeId" = ${storeId} OR ${storeId} IS NULL)
            ) as total
        `;

        const total = Number(totalCountRaw[0].total);

        return {
            ledger: history.map(item => ({
                ...item,
                amount: Number(item.amount),
                balanceAfter: Number(item.balanceAfter),
                createdAt: item.createdAt.toISOString()
            })),
            total
        };
    }

    /**
     * Process Customer Payment (Debt Settlement)
     */
    async customerPayment(storeId, patientId, amount, paymentMethod, notes, allocations = []) {
        logger.info(`Processing payment for ${patientId}: Amount=${amount}, Allocations=${JSON.stringify(allocations)}`);

        return await prisma.$transaction(async (tx) => {
            const patient = await tx.patient.findUnique({
                where: { id: patientId }
            });

            if (!patient) throw new Error("Patient not found");

            // 1. Update Patient Balance (Decrease Debt)
            const updatedPatient = await tx.patient.update({
                where: { id: patientId },
                data: {
                    currentBalance: {
                        decrement: amount
                    }
                }
            });

            // 2. Add to Ledger
            const ledgerEntry = await tx.customerLedger.create({
                data: {
                    storeId,
                    patientId,
                    type: 'CREDIT', // Decreasing debt
                    amount: amount,
                    balanceAfter: updatedPatient.currentBalance,
                    referenceType: 'PAYMENT',
                    notes: notes || `Payment via ${paymentMethod}`,
                    // Link allocations implicitly via the InvoiceAllocation table
                }
            });

            // 3. Process Allocations (if any)
            if (allocations && allocations.length > 0) {
                for (const allocation of allocations) {
                    const { saleId, amount: allocatedAmount } = allocation;
                    const allocValue = parseFloat(allocatedAmount);

                    if (allocValue > 0) {
                        // Create Allocation Record
                        await tx.invoiceAllocation.create({
                            data: {
                                saleId,
                                ledgerId: ledgerEntry.id,
                                amount: allocValue
                            }
                        });

                        // Update Sale Balance and Status
                        const sale = await tx.sale.findUnique({ where: { id: saleId } });
                        if (sale) {
                            const currentBalance = parseFloat(sale.balance);
                            const newBalance = Math.max(0, currentBalance - allocValue);
                            let newStatus = sale.paymentStatus;

                            if (newBalance <= 0.01) { // Floating point tolerance
                                newStatus = 'PAID';
                            } else {
                                newStatus = 'PARTIAL';
                            }

                            const updateData = {
                                balance: newBalance,
                                paymentStatus: newStatus
                            };

                            // If fully paid, ensure the main status is COMPLETED
                            if (newStatus === 'PAID') {
                                updateData.status = 'COMPLETED';
                            }

                            await tx.sale.update({
                                where: { id: saleId },
                                data: updateData
                            });
                        }
                    }
                }
            }

            return ledgerEntry;
        });
    }

    /**
     * Get or create store credit policy
     */
    async getStoreCreditPolicy(storeId) {
        let policy = await prisma.storeCreditPolicy.findUnique({
            where: { storeId }
        });

        if (!policy) {
            policy = await prisma.storeCreditPolicy.create({
                data: { storeId }
            });
        }

        return policy;
    }

    /**
     * Update store credit policy
     */
    async updateStoreCreditPolicy(storeId, data) {
        return await prisma.storeCreditPolicy.upsert({
            where: { storeId },
            update: data,
            create: { storeId, ...data }
        });
    }

    /**
     * Get patient aggregate metrics for insights
     */
    async getPatientMetrics(patientId, storeId) {
        const [summary] = await prisma.$queryRaw`
            SELECT 
                COUNT(*)::int as "visitCount",
                COALESCE(SUM("total"), 0)::float as "totalSpent",
                COALESCE(AVG("total"), 0)::float as "avgBill",
                MIN("createdAt") as "firstVisitAt",
                MAX("createdAt") as "lastVisitAt"
            FROM "Sale"
            WHERE "patientId" = ${patientId}
              AND "storeId" = ${storeId}
              AND "deletedAt" IS NULL
        `;

        return {
            visitCount: Number(summary?.visitCount || 0),
            totalSpent: Number(summary?.totalSpent || 0),
            avgBill: Number(summary?.avgBill || 0),
            firstVisitAt: summary?.firstVisitAt || null,
            lastVisitAt: summary?.lastVisitAt || null
        };
    }

    /**
     * Credit-related metrics for patient
     */
    async getPatientCreditMetrics(patientId, storeId) {
        const [creditStats] = await prisma.$queryRaw`
            SELECT 
                COUNT(*)::int as "creditSalesCount",
                SUM(
                    CASE 
                        WHEN "expectedPaymentDate" IS NOT NULL 
                         AND "expectedPaymentDate" < NOW()
                         AND "paymentStatus" != 'PAID'
                        THEN 1 ELSE 0 END
                )::int as "overdueCount",
                SUM(CASE WHEN "paymentStatus" = 'PAID' THEN 1 ELSE 0 END)::int as "paidCount",
                SUM(
                    CASE 
                        WHEN "paymentStatus" = 'PAID' 
                         AND ("expectedPaymentDate" IS NULL OR "expectedPaymentDate" >= "updatedAt") 
                        THEN 1 ELSE 0 END
                )::int as "onTimeCount"
            FROM "Sale" s
            WHERE s."patientId" = ${patientId}
              AND s."storeId" = ${storeId}
              AND s."deletedAt" IS NULL
              AND (
                s."expectedPaymentDate" IS NOT NULL
                OR s."paymentStatus" IN ('UNPAID','PARTIAL','OVERDUE')
                OR EXISTS (
                    SELECT 1 FROM "PaymentSplit" ps
                    WHERE ps."saleId" = s."id" AND ps."paymentMethod" = 'CREDIT'
                )
              )
        `;

        const [creditTrend] = await prisma.$queryRaw`
            SELECT 
                SUM(CASE WHEN s."createdAt" >= NOW() - INTERVAL '90 days' THEN 1 ELSE 0 END)::int as "recentCreditSales",
                SUM(CASE WHEN s."createdAt" < NOW() - INTERVAL '90 days' AND s."createdAt" >= NOW() - INTERVAL '180 days' THEN 1 ELSE 0 END)::int as "priorCreditSales"
            FROM "Sale" s
            WHERE s."patientId" = ${patientId}
              AND s."storeId" = ${storeId}
              AND s."deletedAt" IS NULL
              AND (
                s."expectedPaymentDate" IS NOT NULL
                OR s."paymentStatus" IN ('UNPAID','PARTIAL','OVERDUE')
                OR EXISTS (
                    SELECT 1 FROM "PaymentSplit" ps
                    WHERE ps."saleId" = s."id" AND ps."paymentMethod" = 'CREDIT'
                )
              )
        `;

        return {
            creditSalesCount: Number(creditStats?.creditSalesCount || 0),
            overdueCount: Number(creditStats?.overdueCount || 0),
            paidCount: Number(creditStats?.paidCount || 0),
            recentCreditSales: Number(creditTrend?.recentCreditSales || 0),
            priorCreditSales: Number(creditTrend?.priorCreditSales || 0)
        };
    }

    /**
     * Refund ratio stats
     */
    async getPatientRefundStats(patientId, storeId) {
        const [refundStats] = await prisma.$queryRaw`
            SELECT COUNT(*)::int as "refundCount"
            FROM "SaleRefund" r
            JOIN "Sale" s ON s."id" = r."originalSaleId"
            WHERE s."patientId" = ${patientId}
              AND s."storeId" = ${storeId}
              AND s."deletedAt" IS NULL
        `;

        return {
            refundCount: Number(refundStats?.refundCount || 0)
        };
    }

    /**
     * Count shared phone number occurrences
     */
    async getPhoneShareCount(storeId, phoneNumber, excludePatientId) {
        const count = await prisma.patient.count({
            where: {
                storeId,
                phoneNumber,
                deletedAt: null,
                ...(excludePatientId ? { id: { not: excludePatientId } } : {}),
            }
        });

        return count;
    }

    /**
     * Get aggregated family metrics
     */
    async getPatientFamilyMetrics(patientId, storeId) {
        // 1. Find all related patient IDs
        const relations = await prisma.patientRelation.findMany({
            where: {
                OR: [
                    { patientId: patientId },
                    { relatedPatientId: patientId }
                ]
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, currentBalance: true, creditLimit: true } },
                relatedPatient: { select: { id: true, firstName: true, lastName: true, currentBalance: true, creditLimit: true } }
            }
        });

        if (relations.length === 0) {
            return {
                familySize: 1, // Self
                familyTotalSpent: 0,
                familyOverdueCount: 0,
                familyMembers: []
            };
        }

        const familyIds = new Set();
        const familyDetails = [];

        relations.forEach(r => {
            const p1 = r.patient;
            const p2 = r.relatedPatient;

            // Add the "other" person in the relationship
            if (p1.id !== patientId) {
                familyIds.add(p1.id);
                familyDetails.push({ ...p1, relation: r.relationType });
            }
            if (p2.id !== patientId) {
                familyIds.add(p2.id);
                familyDetails.push({ ...p2, relation: r.relationType });
            }
        });

        const distinctFamilyIds = Array.from(familyIds);

        if (distinctFamilyIds.length === 0) {
            return { familySize: 1, familyTotalSpent: 0, familyOverdueCount: 0, familyMembers: [] };
        }

        // 2. Aggregate metrics for these IDs
        const [aggregate] = await prisma.$queryRaw`
            SELECT 
                COALESCE(SUM("total"), 0)::float as "totalSpent",
                SUM(
                    CASE 
                        WHEN "expectedPaymentDate" IS NOT NULL 
                         AND "expectedPaymentDate" < NOW()
                         AND "paymentStatus" != 'PAID'
                        THEN 1 ELSE 0 END
                )::int as "overdueCount"
            FROM "Sale"
            WHERE "patientId" IN (${Prisma.join(distinctFamilyIds)})
              AND "storeId" = ${storeId}
              AND "deletedAt" IS NULL
        `;

        // 3. Current credit position of family
        const familyBalance = familyDetails.reduce((sum, m) => sum + Number(m.currentBalance || 0), 0);
        const familyLimit = familyDetails.reduce((sum, m) => sum + Number(m.creditLimit || 0), 0);

        return {
            familySize: distinctFamilyIds.length + 1, // +1 for self
            familyTotalSpent: Number(aggregate?.totalSpent || 0),
            familyOverdueCount: Number(aggregate?.overdueCount || 0),
            familyBalance,
            familyLimit,
            familyMembers: familyDetails
        };
    }
}

module.exports = new PatientRepository();
