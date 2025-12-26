const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * RefillService
 * First-class refill tracking
 * Prevents over-dispensing and enables audit trails
 */
class RefillService {
    /**
     * Create refill records when prescription is created
     * @param {string} prescriptionId 
     * @param {number} totalRefills - Total number of refills authorized (0 = original only)
     * @param {number} authorizedQty - Quantity per refill
     * @param {Date} expiresAt - Optional expiry date for refills
     */
    async createRefills(prescriptionId, totalRefills, authorizedQty, expiresAt = null) {
        const refills = [];

        // Create original fill (refill #0) + additional refills
        for (let i = 0; i <= totalRefills; i++) {
            refills.push({
                prescriptionId,
                refillNumber: i,
                authorizedQty,
                dispensedQty: 0,
                remainingQty: authorizedQty,
                status: 'AVAILABLE',
                expiresAt
            });
        }

        return await prisma.refill.createMany({
            data: refills
        });
    }

    /**
     * Get next available refill for a prescription
     */
    async getNextAvailableRefill(prescriptionId) {
        return await prisma.refill.findFirst({
            where: {
                prescriptionId,
                status: 'AVAILABLE',
                remainingQty: { gt: 0 }
            },
            orderBy: { refillNumber: 'asc' }
        });
    }

    /**
     * Check if prescription has refills remaining
     */
    async hasRefillsAvailable(prescriptionId) {
        const availableRefill = await this.getNextAvailableRefill(prescriptionId);
        return !!availableRefill;
    }

    /**
     * Update refill after dispensing
     */
    async updateRefillAfterDispense(refillId, quantityDispensed) {
        const refill = await prisma.refill.findUnique({
            where: { id: refillId }
        });

        if (!refill) {
            throw new Error('Refill not found');
        }

        const newDispensedQty = refill.dispensedQty + quantityDispensed;
        const newRemainingQty = refill.authorizedQty - newDispensedQty;

        let newStatus = refill.status;
        if (newRemainingQty === 0) {
            newStatus = 'FULLY_USED';
        } else if (newDispensedQty > 0 && newRemainingQty > 0) {
            newStatus = 'PARTIALLY_USED';
        }

        return await prisma.refill.update({
            where: { id: refillId },
            data: {
                dispensedQty: newDispensedQty,
                remainingQty: newRemainingQty,
                status: newStatus
            }
        });
    }

    /**
     * Get all refills for a prescription (for refill history display)
     */
    async getRefillHistory(prescriptionId) {
        return await prisma.refill.findMany({
            where: { prescriptionId },
            orderBy: { refillNumber: 'asc' },
            include: {
                dispenses: {
                    include: {
                        sale: {
                            select: {
                                id: true,
                                invoiceNumber: true,
                                createdAt: true,
                                total: true
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Check if all refills are exhausted
     */
    async areAllRefillsExhausted(prescriptionId) {
        const unusedRefills = await prisma.refill.count({
            where: {
                prescriptionId,
                OR: [
                    { status: 'AVAILABLE' },
                    { status: 'PARTIALLY_USED' }
                ]
            }
        });

        return unusedRefills === 0;
    }

    /**
     * Mark refill as expired
     */
    async markRefillAsExpired(refillId) {
        return await prisma.refill.update({
            where: { id: refillId },
            data: { status: 'EXPIRED' }
        });
    }

    /**
     * Cancel remaining refills (e.g., prescription discontinued)
     */
    async cancelRemainingRefills(prescriptionId) {
        return await prisma.refill.updateMany({
            where: {
                prescriptionId,
                status: { in: ['AVAILABLE', 'PARTIALLY_USED'] }
            },
            data: { status: 'CANCELLED' }
        });
    }
}

module.exports = new RefillService();
