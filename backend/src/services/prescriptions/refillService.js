const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');

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
        console.log('🔵 [RefillService] updateRefillAfterDispense called:', { refillId, quantityDispensed });
        
        const refill = await prisma.refill.findUnique({
            where: { id: refillId },
            include: { prescription: true }
        });

        if (!refill) {
            throw new Error('Refill not found');
        }

        console.log('🔵 [RefillService] Current refill state:', {
            refillNumber: refill.refillNumber,
            currentDispensed: refill.dispensedQty,
            currentRemaining: refill.remainingQty,
            authorized: refill.authorizedQty,
            status: refill.status
        });

        const newDispensedQty = Number(refill.dispensedQty) + Number(quantityDispensed);
        const newRemainingQty = Number(refill.authorizedQty) - newDispensedQty;

        let newStatus = refill.status;
        if (newRemainingQty <= 0) {
            newStatus = 'FULLY_USED';
        } else if (newDispensedQty > 0) {
            newStatus = 'PARTIALLY_USED';
        }

        console.log('🔵 [RefillService] New refill state:', {
            newDispensedQty,
            newRemainingQty,
            newStatus
        });

        const updatedRefill = await prisma.refill.update({
            where: { id: refillId },
            data: {
                dispensedQty: newDispensedQty,
                remainingQty: Math.max(0, newRemainingQty),
                status: newStatus
            }
        });

        console.log('🔵 [RefillService] Refill updated in DB');

        // Immediately trigger prescription status update if refill is exhausted
        if (newStatus === 'FULLY_USED') {
            console.log('🟢 [RefillService] Refill FULLY_USED - triggering prescription status update');
            const prescriptionService = require('./prescriptionService');
            await prescriptionService.updatePrescriptionStatus(refill.prescriptionId, null);
            console.log('🟢 [RefillService] Prescription status update completed');
        }

        return updatedRefill;
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
