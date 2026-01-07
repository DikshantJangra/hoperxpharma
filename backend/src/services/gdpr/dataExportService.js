const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const prisma = require('../../db/prisma');

/**
 * GDPR Data Export Service
 * Collects all user data from various tables for GDPR compliance
 */

/**
 * Collect all data for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Complete user data export
 */
const collectUserData = async (userId) => {
    try {
        // Fetch user profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude sensitive fields like password
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Fetch user's stores
        const stores = await prisma.store.findMany({
            where: {
                users: {
                    some: { userId },
                },
            },
            include: {
                users: {
                    where: { userId },
                    select: { role: true },
                },
            },
        });

        // Fetch patients associated with user's stores
        const storeIds = stores.map(s => s.id);
        const patients = await prisma.patient.findMany({
            where: {
                storeId: { in: storeIds },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                dateOfBirth: true,
                address: true,
                createdAt: true,
                storeId: true,
            },
        });

        // Fetch prescriptions
        const prescriptions = await prisma.prescription.findMany({
            where: {
                storeId: { in: storeIds },
            },
            select: {
                id: true,
                prescriptionNumber: true,
                patientId: true,
                doctorName: true,
                diagnosis: true,
                notes: true,
                medications: true,
                createdAt: true,
            },
        });

        // Fetch sales/invoices
        const sales = await prisma.sale.findMany({
            where: {
                storeId: { in: storeIds },
            },
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                paymentMethod: true,
                createdAt: true,
                items: {
                    select: {
                        drugId: true,
                        quantity: true,
                        price: true,
                    },
                },
            },
        });

        // Fetch audit logs (user's actions)
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 1000, // Limit to last 1000 entries
            select: {
                action: true,
                entityType: true,
                entityId: true,
                createdAt: true,
                ipAddress: true,
            },
        });

        // Assemble complete data export
        return {
            exportDate: new Date().toISOString(),
            user: {
                ...user,
                dataRetentionPolicy: 'Data retained as per legal requirements',
            },
            stores: stores.map(store => ({
                id: store.id,
                name: store.name,
                userRole: store.users[0]?.role,
            })),
            patients: patients.length > 0 ? patients : [],
            prescriptions: prescriptions.length > 0 ? prescriptions : [],
            sales: sales.length > 0 ? sales : [],
            auditLogs: auditLogs.length > 0 ? auditLogs : [],
            metadata: {
                totalPatients: patients.length,
                totalPrescriptions: prescriptions.length,
                totalSales: sales.length,
                totalAuditLogs: auditLogs.length,
            },
        };
    } catch (error) {
        logger.error('Error collecting user data:', error);
        throw error;
    }
};

/**
 * Convert data to CSV format
 * @param {Object} userData - User data object
 * @returns {string} CSV formatted string
 */
const convertToCSV = (userData) => {
    const sections = [];

    // User Profile
    sections.push('USER PROFILE');
    sections.push('Field,Value');
    Object.entries(userData.user).forEach(([key, value]) => {
        if (typeof value !== 'object') {
            sections.push(`${key},"${value}"`);
        }
    });
    sections.push('');

    // Patients
    if (userData.patients.length > 0) {
        sections.push('PATIENTS');
        const patientHeaders = Object.keys(userData.patients[0]);
        sections.push(patientHeaders.join(','));
        userData.patients.forEach(patient => {
            const row = patientHeaders.map(h => `"${patient[h] || ''}"`).join(',');
            sections.push(row);
        });
        sections.push('');
    }

    // Prescriptions
    if (userData.prescriptions.length > 0) {
        sections.push('PRESCRIPTIONS');
        sections.push('ID,Number,Patient ID,Doctor,Diagnosis,Date');
        userData.prescriptions.forEach(rx => {
            sections.push(`"${rx.id}","${rx.prescriptionNumber}","${rx.patientId}","${rx.doctorName || ''}","${rx.diagnosis || ''}","${rx.createdAt}"`);
        });
        sections.push('');
    }

    // Sales
    if (userData.sales.length > 0) {
        sections.push('SALES');
        sections.push('Invoice Number,Amount,Payment Method,Date');
        userData.sales.forEach(sale => {
            sections.push(`"${sale.invoiceNumber}","${sale.totalAmount}","${sale.paymentMethod}","${sale.createdAt}"`);
        });
        sections.push('');
    }

    return sections.join('\n');
};

module.exports = {
    collectUserData,
    convertToCSV,
};
