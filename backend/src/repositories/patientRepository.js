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
}

module.exports = new PatientRepository();
