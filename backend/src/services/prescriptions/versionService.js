const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');

/**
 * PrescriptionVersionService
 * Manages immutable clinical snapshots of prescriptions
 * Every edit creates a new version - NEVER updates existing versions
 */
class PrescriptionVersionService {
    /**
     * Create the first version (v1) when a prescription is created
     */
    async createInitialVersion(prescriptionId, items, instructions, createdBy) {
        return await prisma.prescriptionVersion.create({
            data: {
                prescriptionId,
                versionNumber: 1,
                instructions,
                createdBy,
                items: {
                    create: items.map(item => ({
                        drugId: item.drugId,
                        batchId: item.batchId || null,
                        quantityPrescribed: item.quantity,
                        sig: item.sig,
                        daysSupply: item.daysSupply,
                        substitutionAllowed: item.substitutionAllowed !== false,
                        isControlled: item.isControlled || false
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true
                    }
                }
            }
        });
    }

    /**
     * Create a new version (edit)
     * NEVER updates - always creates new version
     */
    async createNewVersion(prescriptionId, data, userId, reason) {
        // Get latest version number
        const latestVersion = await prisma.prescriptionVersion.findFirst({
            where: { prescriptionId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true }
        });

        const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

        return await prisma.prescriptionVersion.create({
            data: {
                prescriptionId,
                versionNumber: newVersionNumber,
                instructions: data.instructions,
                substitutionNotes: data.substitutionNotes,
                attachments: data.attachments,
                changedReason: reason,
                createdBy: userId,
                items: {
                    create: data.items.map(item => ({
                        drugId: item.drugId,
                        batchId: item.batchId || null,
                        quantityPrescribed: item.quantity,
                        sig: item.sig,
                        daysSupply: item.daysSupply,
                        substitutionAllowed: item.substitutionAllowed !== false,
                        isControlled: item.isControlled || false
                    }))
                }
            },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true
                    }
                }
            }
        });
    }

    /**
     * Get all versions for a prescription (audit trail)
     */
    async getVersionHistory(prescriptionId) {
        return await prisma.prescriptionVersion.findMany({
            where: { prescriptionId },
            orderBy: { versionNumber: 'asc' },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true
                    }
                }
            }
        });
    }

    /**
     * Get latest version for a prescription
     */
    async getLatestVersion(prescriptionId) {
        return await prisma.prescriptionVersion.findFirst({
            where: { prescriptionId },
            orderBy: { versionNumber: 'desc' },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true
                    }
                }
            }
        });
    }

    /**
     * Get a specific version by version number
     */
    async getVersion(prescriptionId, versionNumber) {
        return await prisma.prescriptionVersion.findUnique({
            where: {
                prescriptionId_versionNumber: {
                    prescriptionId,
                    versionNumber
                }
            },
            include: {
                items: {
                    include: {
                        drug: true,
                        batch: true
                    }
                }
            }
        });
    }
}

module.exports = new PrescriptionVersionService();
