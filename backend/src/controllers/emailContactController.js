const ApiResponse = require('../utils/ApiResponse');
const logger = require('../config/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../db/prisma');

class EmailContactController {
    /**
     * Search contacts across patients, prescribers, and suppliers
     * GET /api/v1/email/contacts/search?q=john&types=patient,prescriber
     */
    async searchContacts(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { q = '', types = 'patient,prescriber,supplier' } = req.query;

            const searchTypes = types.split(',');
            const results = {
                patients: [],
                prescribers: [],
                suppliers: [],
            };

            // Search patients
            if (searchTypes.includes('patient') && q.length >= 2) {
                results.patients = await prisma.patient.findMany({
                    where: {
                        storeId,
                        OR: [
                            { firstName: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                            { lastName: { contains: q, mode: 'insensitive' } },
                            { phoneNumber: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    },
                    take: 10,
                });
                // Map firstName + lastName to name
                results.patients = results.patients.map(p => ({ ...p, name: `${p.firstName} ${p.lastName}`.trim() }));
            }

            // Search prescribers
            if (searchTypes.includes('prescriber') && q.length >= 2) {
                results.prescribers = await prisma.prescriber.findMany({
                    where: {
                        storeId,
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                            { specialty: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        specialty: true,
                        phoneNumber: true,
                    },
                    take: 10,
                });
            }

            // Search suppliers
            if (searchTypes.includes('supplier') && q.length >= 2) {
                results.suppliers = await prisma.supplier.findMany({
                    where: {
                        storeId,
                        OR: [
                            { name: { contains: q, mode: 'insensitive' } },
                            { email: { contains: q, mode: 'insensitive' } },
                            { contactName: { contains: q, mode: 'insensitive' } },
                        ],
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        contactName: true,
                        phoneNumber: true,
                    },
                    take: 10,
                });
            }

            // Calculate total results
            const total = results.patients.length + results.prescribers.length + results.suppliers.length;

            res.status(200).json(
                new ApiResponse(200, { ...results, total }, 'Contacts retrieved successfully')
            );
        } catch (error) {
            logger.error('Search contacts error:', error);
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to search contacts')
            );
        }
    }

    /**
     * Get recipient groups (recent customers, active patients, etc.)
     * GET /api/v1/email/groups
     */
    async getRecipientGroups(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;

            // Get counts for each group
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const [recentCustomers, activePatients, frequentPrescribers, activeSuppliers] = await Promise.all([
                // Recent customers (patients with sales in last 30 days)
                prisma.patient.count({
                    where: {
                        storeId,
                        email: { not: null },
                        sales: {
                            some: {
                                createdAt: { gte: thirtyDaysAgo },
                            },
                        },
                    },
                }),

                // Active patients (with prescriptions this year)
                prisma.patient.count({
                    where: {
                        storeId,
                        email: { not: null },
                        prescriptions: {
                            some: {
                                createdAt: { gte: oneYearAgo },
                            },
                        },
                    },
                }),

                // Frequent prescribers (with 5+ prescriptions)
                prisma.prescriber.count({
                    where: {
                        storeId,
                        email: { not: null },
                        prescriptions: {
                            some: {},
                        },
                    },
                }),

                // Active suppliers
                prisma.supplier.count({
                    where: {
                        storeId,
                        email: { not: null },
                        deletedAt: null,
                    },
                }),
            ]);

            const groups = [
                {
                    id: 'recent-customers',
                    name: 'Recent Customers',
                    description: 'Customers with purchases in last 30 days',
                    count: recentCustomers,
                    type: 'patient',
                    icon: 'users',
                },
                {
                    id: 'active-patients',
                    name: 'Active Patients',
                    description: 'Patients with prescriptions this year',
                    count: activePatients,
                    type: 'patient',
                    icon: 'activity',
                },
                {
                    id: 'frequent-prescribers',
                    name: 'Frequent Prescribers',
                    description: 'Doctors who prescribe regularly',
                    count: frequentPrescribers,
                    type: 'prescriber',
                    icon: 'user-check',
                },
                {
                    id: 'active-suppliers',
                    name: 'Active Suppliers',
                    description: 'Current active suppliers',
                    count: activeSuppliers,
                    type: 'supplier',
                    icon: 'package',
                },
            ];

            res.status(200).json(
                new ApiResponse(200, { groups }, 'Recipient groups retrieved successfully')
            );
        } catch (error) {
            logger.error('Get groups error:', error);
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to retrieve groups')
            );
        }
    }

    /**
     * Get recipients for a specific group
     * GET /api/v1/email/groups/:groupId/recipients
     */
    async getGroupRecipients(req, res) {
        try {
            const storeId = req.user.storeId || req.storeId;
            const { groupId } = req.params;

            let recipients = [];

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            switch (groupId) {
                case 'recent-customers':
                    recipients = await prisma.patient.findMany({
                        where: {
                            storeId,
                            email: { not: null },
                            sales: {
                                some: {
                                    createdAt: { gte: thirtyDaysAgo },
                                },
                            },
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phoneNumber: true,
                        },
                    });
                    break;

                case 'active-patients':
                    recipients = await prisma.patient.findMany({
                        where: {
                            storeId,
                            email: { not: null },
                            prescriptions: {
                                some: {
                                    createdAt: { gte: oneYearAgo },
                                },
                            },
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phoneNumber: true,
                        },
                    });
                    break;

                case 'frequent-prescribers':
                    recipients = await prisma.prescriber.findMany({
                        where: {
                            storeId,
                            email: { not: null },
                            prescriptions: {
                                some: {},
                            },
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            specialty: true,
                            phoneNumber: true,
                        },
                    });
                    break;

                case 'active-suppliers':
                    recipients = await prisma.supplier.findMany({
                        where: {
                            storeId,
                            email: { not: null },
                            deletedAt: null,
                        },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            contactName: true,
                            phoneNumber: true,
                        },
                    });
                    break;

                default:
                    return res.status(404).json(
                        new ApiResponse(404, null, 'Group not found')
                    );
            }

            res.status(200).json(
                new ApiResponse(200, { recipients, count: recipients.length }, 'Group recipients retrieved successfully')
            );
        } catch (error) {
            logger.error('Get group recipients error:', error);
            res.status(error.statusCode || 500).json(
                new ApiResponse(error.statusCode || 500, null, error.message || 'Failed to retrieve group recipients')
            );
        }
    }
}

module.exports = new EmailContactController();
