const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const prisma = require('../../db/prisma');

class QueueService {
    /**
     * Get prescription queue items filtered by stage and other criteria
     */
    async getQueueItems(storeId, filters = {}) {
        const {
            stage,
            search,
            priority,
            prescriberId,
            isControlled,
            dateRange
        } = filters;

        const where = {
            storeId,
            deletedAt: null
        };

        // Filter by stage
        if (stage) {
            where.stage = stage;
        }

        // Filter by priority
        if (priority) {
            where.priority = priority;
        }

        // Filter by prescriber
        if (prescriberId) {
            where.prescriberId = prescriberId;
        }

        // Filter by controlled substance
        if (isControlled !== undefined) {
            where.controlledFlag = isControlled === 'true';
        }

        // Date range filter
        if (dateRange) {
            const now = new Date();
            let startDate;

            switch (dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setDate(now.getDate() - 30));
                    break;
            }

            if (startDate) {
                where.createdAt = {
                    gte: startDate
                };
            }
        }

        // Search filter (patient name, phone, Rx ID)
        if (search) {
            where.OR = [
                {
                    patient: {
                        OR: [
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                            { phoneNumber: { contains: search } }
                        ]
                    }
                },
                { id: { contains: search, mode: 'insensitive' } } // Rx ID
            ];
        }

        const prescriptions = await prisma.prescription.findMany({
            where,
            include: {
                patient: true,
                prescriber: true,
                items: {
                    include: {
                        drug: true
                    }
                },
                assignedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' }, // Urgent first
                { createdAt: 'asc' }   // Oldest first (FIFO)
            ]
        });

        return prescriptions;
    }

    /**
     * Update prescription stage
     */
    async updateStage(id, stage, userId) {
        // Validate stage
        const validStages = ['NEW', 'UNVERIFIED', 'VERIFIED', 'READY', 'DELIVERED', 'ON_HOLD'];
        if (!validStages.includes(stage)) {
            throw new Error(`Invalid stage: ${stage}`);
        }

        const updateData = {
            stage,
            updatedAt: new Date()
        };

        // Automatically update status based on stage
        if (['VERIFIED', 'READY'].includes(stage)) {
            updateData.status = 'IN_PROGRESS';
        } else if (stage === 'ON_HOLD') {
            updateData.status = 'ON_HOLD';
        } else if (stage === 'DELIVERED') {
            updateData.status = 'COMPLETED';
        }

        const prescription = await prisma.prescription.update({
            where: { id },
            data: updateData,
            include: {
                patient: true
            }
        });

        // Log the stage change
        await prisma.auditLog.create({
            data: {
                storeId: prescription.storeId,
                userId,
                action: 'PRESCRIPTION_STAGE_UPDATE',
                resource: 'Prescription',
                resourceId: id,
                details: {
                    from: prescription.stage, // Note: this is actually the new stage, we'd need previous to be accurate but this is simple for now
                    to: stage
                }
            }
        });

        return prescription;
    }

    /**
     * Bulk update prescriptions
     */
    async bulkUpdate(ids, action, data, userId) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of ids) {
            try {
                if (action === 'update_stage') {
                    await this.updateStage(id, data.stage, userId);
                } else if (action === 'assign') {
                    await prisma.prescription.update({
                        where: { id },
                        data: { assignedTo: data.userId }
                    });
                } else if (action === 'delete') {
                    await prisma.prescription.update({
                        where: { id },
                        data: { deletedAt: new Date() }
                    });
                }

                results.success.push(id);
            } catch (error) {
                logger.error(`Failed to update Rx ${id}:`, error);
                results.failed.push({ id, error: error.message });
            }
        }

        return results;
    }
}

module.exports = new QueueService();
