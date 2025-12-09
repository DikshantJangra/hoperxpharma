const database = require('../config/database');
const { buildOrderBy } = require('../utils/queryParser');

const prisma = database.getClient();

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
                },
            }),
            prisma.patient.count({ where }),
        ]);

        return { patients, total };
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
                    orderBy: { createdAt: 'desc' },
                },
                sales: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!patient) return null;

        // Convert Decimal fields to numbers for JSON serialization
        return {
            ...patient,
            currentBalance: Number(patient.currentBalance),
            creditLimit: Number(patient.creditLimit)
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
        return await prisma.patient.findMany({
            where: {
                storeId,
                deletedAt: null,
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
            },
            take: 10, // Limit to 10 results for autocomplete
            orderBy: { createdAt: 'desc' },
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
        COUNT(CASE WHEN "gender" = 'Male' THEN 1 END) as "maleCount",
        COUNT(CASE WHEN "gender" = 'Female' THEN 1 END) as "femaleCount"
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
                    include: { prescriber: true, items: { include: { drug: true } } },
                    orderBy: { createdAt: 'desc' },
                })
                : [],
            eventType === 'all' || eventType === 'sale'
                ? prisma.sale.findMany({
                    where: { patientId, ...whereDate },
                    include: { items: { include: { batch: { include: { drug: true } } } } },
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
            console.error('Error fetching refills due:', error);
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

                    if (batch.quantityInStock < item.quantity) {
                        throw new Error(
                            `Insufficient stock for ${batch.drug.name}. Available: ${batch.quantityInStock}, Requested: ${item.quantity}`
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
     * Get patient ledger history
     */
    async getLedger({ patientId, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;

        const [ledger, total] = await Promise.all([
            prisma.customerLedger.findMany({
                where: { patientId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    allocations: {
                        include: {
                            sale: {
                                select: {
                                    invoiceNumber: true
                                }
                            }
                        }
                    }
                }
            }),
            prisma.customerLedger.count({ where: { patientId } }),
        ]);

        return { ledger, total };
    }

    /**
     * Process Customer Payment (Debt Settlement)
     */
    async customerPayment(storeId, patientId, amount, paymentMethod, notes, allocations = []) {
        console.log(`Processing payment for ${patientId}: Amount=${amount}, Allocations=${JSON.stringify(allocations)}`);

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

                            await tx.sale.update({
                                where: { id: saleId },
                                data: {
                                    balance: newBalance,
                                    paymentStatus: newStatus
                                }
                            });
                        }
                    }
                }
            }

            return ledgerEntry;
        });
    }
}

module.exports = new PatientRepository();
