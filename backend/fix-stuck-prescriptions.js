/**
 * Migration Script: Fix Stuck Prescription Statuses
 * 
 * This script fixes prescriptions that are stuck in VERIFIED status
 * when they should be ACTIVE or COMPLETED based on their refill status.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixStuckPrescriptions() {
    console.log('🔧 Fixing Stuck Prescription Statuses\n');

    try {
        // Find all prescriptions stuck in VERIFIED with activity
        const stuckPrescriptions = await prisma.prescription.findMany({
            where: {
                status: 'VERIFIED',
                refills: {
                    some: {
                        OR: [
                            { status: 'FULLY_USED' },
                            { dispensedQty: { gt: 0 } }
                        ]
                    }
                }
            },
            include: {
                refills: true
            }
        });

        console.log(`Found ${stuckPrescriptions.length} prescriptions to fix\n`);

        let fixedCount = 0;
        let completedCount = 0;
        let activeCount = 0;

        for (const prescription of stuckPrescriptions) {
            const allRefillsExhausted = prescription.refills.every(r => 
                r.status === 'FULLY_USED' || Number(r.remainingQty) <= 0
            );

            const hasActivity = prescription.refills.some(r => Number(r.dispensedQty) > 0);

            let newStatus = prescription.status;
            let reason = '';

            if (allRefillsExhausted) {
                newStatus = 'COMPLETED';
                reason = 'All refills dispensed';
                completedCount++;
            } else if (hasActivity) {
                newStatus = 'ACTIVE';
                reason = 'Dispensing started';
                activeCount++;
            }

            if (newStatus !== prescription.status) {
                await prisma.prescription.update({
                    where: { id: prescription.id },
                    data: { status: newStatus }
                });

                // Create audit log
                await prisma.auditLog.create({
                    data: {
                        storeId: prescription.storeId,
                        userId: prescription.storeId, // System action
                        action: `PRESCRIPTION_${newStatus}`,
                        entityType: 'Prescription',
                        entityId: prescription.id,
                        changes: {
                            previousStatus: prescription.status,
                            newStatus,
                            reason: `Migration fix: ${reason}`,
                            refillsUsed: prescription.refills.filter(r => r.status === 'FULLY_USED').length,
                            totalRefills: prescription.refills.length
                        }
                    }
                });

                console.log(`✅ Fixed ${prescription.prescriptionNumber}: VERIFIED → ${newStatus} (${reason})`);
                fixedCount++;
            }
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total Fixed: ${fixedCount}`);
        console.log(`   → ACTIVE: ${activeCount}`);
        console.log(`   → COMPLETED: ${completedCount}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

fixStuckPrescriptions();
