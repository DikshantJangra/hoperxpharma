/**
 * Test Script: Verify Prescription Status Update Logic
 * 
 * This script tests:
 * 1. ONE_TIME prescription status updates to COMPLETED after full dispense
 * 2. REPEAT prescription status updates to ACTIVE after partial dispense
 * 3. Refill exhaustion triggers COMPLETED status
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStatusUpdates() {
    console.log('🧪 Testing Prescription Status Update Logic\n');

    try {
        // Find a VERIFIED prescription with 0 refills (ONE_TIME)
        const oneTimePrescription = await prisma.prescription.findFirst({
            where: {
                status: 'VERIFIED',
                totalRefills: 0
            },
            include: {
                refills: true
            }
        });

        if (oneTimePrescription) {
            console.log('✅ Found ONE_TIME prescription:', oneTimePrescription.prescriptionNumber);
            console.log('   Status:', oneTimePrescription.status);
            console.log('   Total Refills:', oneTimePrescription.totalRefills);
            console.log('   Refills in DB:', oneTimePrescription.refills.length);
            
            const mainRefill = oneTimePrescription.refills.find(r => r.refillNumber === 0);
            if (mainRefill) {
                console.log('   Main Refill Status:', mainRefill.status);
                console.log('   Remaining Qty:', mainRefill.remainingQty);
                console.log('   Dispensed Qty:', mainRefill.dispensedQty);
            }
        } else {
            console.log('⚠️  No ONE_TIME VERIFIED prescriptions found');
        }

        console.log('\n---\n');

        // Find a VERIFIED prescription with refills (REPEAT)
        const repeatPrescription = await prisma.prescription.findFirst({
            where: {
                status: 'VERIFIED',
                totalRefills: { gt: 0 }
            },
            include: {
                refills: true
            }
        });

        if (repeatPrescription) {
            console.log('✅ Found REPEAT prescription:', repeatPrescription.prescriptionNumber);
            console.log('   Status:', repeatPrescription.status);
            console.log('   Total Refills:', repeatPrescription.totalRefills);
            console.log('   Refills in DB:', repeatPrescription.refills.length);
            
            repeatPrescription.refills.forEach(refill => {
                console.log(`   Refill #${refill.refillNumber}: ${refill.status} (Remaining: ${refill.remainingQty})`);
            });
        } else {
            console.log('⚠️  No REPEAT VERIFIED prescriptions found');
        }

        console.log('\n---\n');

        // Check for any prescriptions stuck in VERIFIED with dispensed refills
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

        if (stuckPrescriptions.length > 0) {
            console.log(`🐛 Found ${stuckPrescriptions.length} prescriptions STUCK in VERIFIED with activity:\n`);
            stuckPrescriptions.forEach(rx => {
                console.log(`   ${rx.prescriptionNumber}:`);
                console.log(`   - Status: ${rx.status} (should be ACTIVE or COMPLETED)`);
                console.log(`   - Total Refills: ${rx.totalRefills}`);
                rx.refills.forEach(refill => {
                    console.log(`   - Refill #${refill.refillNumber}: ${refill.status} (Dispensed: ${refill.dispensedQty}, Remaining: ${refill.remainingQty})`);
                });
                console.log('');
            });
        } else {
            console.log('✅ No prescriptions stuck in VERIFIED with activity');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testStatusUpdates();
