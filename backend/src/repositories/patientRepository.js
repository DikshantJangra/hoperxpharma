const database = require('../config/database');

const prisma = database.getClient();

/**
 * Patient Repository - Data access layer for patient operations
 */
class PatientRepository {
    /**
     * Find patients with pagination and search
     */
    async findPatients({ storeId, page = 1, limit = 20, search = '' }) {
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

        const [patients, total] = await Promise.all([
            prisma.patient.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
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
     * Find patient by ID
     */
    async findById(id) {
        return await prisma.patient.findUnique({
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
    async getRefillsDue(storeId, { status = 'all', search = '' } = {}) {
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Get all adherence records with expected refill dates
        const adherenceRecords = await prisma.patientAdherence.findMany({
            where: {
                patient: {
                    storeId,
                    deletedAt: null,
                },
                actualRefillDate: null, // Not yet refilled
            },
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
            orderBy: { expectedRefillDate: 'asc' },
        });

        // Calculate status for each record
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

        // Filter by status if specified
        let filteredRefills = refills;
        if (status !== 'all') {
            filteredRefills = refills.filter((r) => r.status === status);
        }

        // Filter by search if specified
        if (search) {
            const searchLower = search.toLowerCase();
            filteredRefills = filteredRefills.filter(
                (r) =>
                    r.patient.firstName.toLowerCase().includes(searchLower) ||
                    r.patient.lastName.toLowerCase().includes(searchLower) ||
                    r.patient.phoneNumber.includes(search)
            );
        }

        return filteredRefills;
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
     * Get all consents for a store (for consents page)
     */
    async getAllConsents(storeId, { status = 'all', page = 1, limit = 20 } = {}) {
        const skip = (page - 1) * limit;

        const where = {
            patient: {
                storeId,
                deletedAt: null,
            },
            ...(status !== 'all' && { status }),
        };

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
                orderBy: { grantedDate: 'desc' },
            }),
            prisma.patientConsent.count({ where }),
        ]);

        return { consents, total };
    }
}

module.exports = new PatientRepository();
