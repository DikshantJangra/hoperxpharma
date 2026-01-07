const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');

/**
 * DispenseService
 * Manages operational workflow for dispensing prescriptions
 * Powers the Workbench Kanban board
 */
class DispenseService {
    /**
     * Create a dispense record (initiate dispensing workflow)
     * @param {string} refillId - Which refill to dispense from
     * @param {string} prescriptionVersionId - Clinical snapshot to use
     * @param {string} queuedBy - User ID who initiated
     */
    async createDispense(refillId, prescriptionVersionId, queuedBy) {
        // Validate refill is available
        const refill = await prisma.refill.findUnique({
            where: { id: refillId },
            include: { prescription: true }
        });

        if (!refill) {
            throw new Error('Refill not found');
        }

        if (refill.status !== 'AVAILABLE' && refill.status !== 'PARTIALLY_USED') {
            throw new Error(`Cannot dispense from refill with status: ${refill.status}`);
        }

        if (refill.remainingQty <= 0) {
            throw new Error('No quantity remaining for this refill');
        }

        return await prisma.dispense.create({
            data: {
                refillId,
                prescriptionVersionId,
                status: 'QUEUED',
                queuedBy,
                queuedAt: new Date()
            },
            include: {
                refill: {
                    include: {
                        prescription: {
                            include: {
                                patient: true,
                                prescriber: true
                            }
                        }
                    }
                },
                prescriptionVersion: {
                    include: {
                        items: {
                            include: {
                                drug: true,
                                batch: true
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update dispense workflow status
     */
    async updateStatus(dispenseId, newStatus, userId, notes = null) {
        const updateData = {
            status: newStatus,
            notes
        };

        // Set timestamps and user assignments based on status
        const now = new Date();
        switch (newStatus) {
            case 'VERIFYING':
                updateData.verifyingAt = now;
                updateData.verifiedBy = userId;
                break;
            case 'FILLING':
                updateData.fillingAt = now;
                updateData.filledBy = userId;
                break;
            case 'CHECKING':
                updateData.checkingAt = now;
                updateData.checkedBy = userId;
                break;
            case 'READY':
                updateData.readyAt = now;
                break;
            case 'COMPLETED':
                updateData.completedAt = now;
                updateData.dispensedBy = userId;
                break;
            case 'CANCELLED':
                updateData.cancelledAt = now;
                break;
        }

        return await prisma.dispense.update({
            where: { id: dispenseId },
            data: updateData,
            include: {
                refill: {
                    include: {
                        prescription: {
                            include: {
                                patient: true,
                                prescriber: true
                            }
                        }
                    }
                },
                prescriptionVersion: {
                    include: {
                        items: {
                            include: {
                                drug: true
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Get dispenses for Workbench (Kanban view)
     * @param {string} storeId 
     * @param {string} status - Filter by status (QUEUED, VERIFYING, etc.)
     */
    async getWorkbenchDispenses(storeId, status = null) {
        const where = {
            refill: {
                prescription: {
                    storeId,
                    deletedAt: null
                }
            },
            status: status || { in: ['QUEUED', 'VERIFYING', 'FILLING', 'CHECKING', 'READY'] }
        };

        return await prisma.dispense.findMany({
            where,
            include: {
                refill: {
                    include: {
                        prescription: {
                            include: {
                                patient: true,
                                prescriber: true
                            }
                        }
                    }
                },
                prescriptionVersion: {
                    include: {
                        items: {
                            include: {
                                drug: true
                            }
                        }
                    }
                },
                sale: {
                    select: {
                        id: true,
                        invoiceNumber: true
                    }
                }
            },
            orderBy: { queuedAt: 'asc' }
        });
    }

    /**
     * Get dispenses grouped by status (for Kanban columns)
     */
    async getWorkbenchByColumns(storeId) {
        const allDispenses = await this.getWorkbenchDispenses(storeId);

        return {
            QUEUED: allDispenses.filter(d => d.status === 'QUEUED'),
            VERIFYING: allDispenses.filter(d => d.status === 'VERIFYING'),
            FILLING: allDispenses.filter(d => d.status === 'FILLING'),
            CHECKING: allDispenses.filter(d => d.status === 'CHECKING'),
            READY: allDispenses.filter(d => d.status === 'READY')
        };
    }

    /**
     * Mark dispense as ready for sale (final step before POS)
     */
    async markReadyForSale(dispenseId, userId) {
        return await this.updateStatus(dispenseId, 'READY', userId);
    }

    /**
     * Complete dispense after sale is finalized
     */
    async completeDispense(dispenseId, userId, quantityDispensed) {
        const dispense = await prisma.dispense.findUnique({
            where: { id: dispenseId },
            include: { 
                refill: {
                    include: {
                        prescription: true
                    }
                }
            }
        });

        if (!dispense) {
            throw new Error('Dispense not found');
        }

        // Update dispense status
        const updatedDispense = await this.updateStatus(dispenseId, 'COMPLETED', userId);

        // Update refill quantities (this will also trigger prescription status update)
        const refillService = require('./refillService');
        await refillService.updateRefillAfterDispense(dispense.refillId, quantityDispensed);

        return updatedDispense;
    }

    /**
     * Cancel dispense with reason
     */
    async cancelDispense(dispenseId, userId, reason) {
        return await prisma.dispense.update({
            where: { id: dispenseId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: reason
            }
        });
    }

    /**
     * Get dispense by ID with full details
     */
    async getDispenseById(dispenseId) {
        return await prisma.dispense.findUnique({
            where: { id: dispenseId },
            include: {
                refill: {
                    include: {
                        prescription: {
                            include: {
                                patient: true,
                                prescriber: true,
                                store: true
                            }
                        }
                    }
                },
                prescriptionVersion: {
                    include: {
                        items: {
                            include: {
                                drug: true,
                                batch: true
                            }
                        }
                    }
                },
                sale: true
            }
        });
    }
}

module.exports = new DispenseService();
