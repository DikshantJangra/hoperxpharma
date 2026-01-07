const { PrismaClient } = require('@prisma/client');
const prescriptionService = require('./backend/src/services/prescriptions/prescriptionService');
const refillService = require('./backend/src/services/prescriptions/refillService');
const dispenseService = require('./backend/src/services/prescriptions/dispenseService');

const prisma = new PrismaClient();

async function runTest() {
    console.log('Starting test...');
    const userId = 'cmj05wyl10000149rm17ka144'; // Using a dummy ID format, assuming user exists or DB allows
    // Ideally we should find a real user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No user found');
        return;
    }
    const realUserId = user.id;

    const store = await prisma.store.findFirst();
    if (!store) {
        console.error('No store found');
        return;
    }

    try {
        console.log('1. Creating ONE_TIME prescription...');
        const rxData = {
            storeId: store.id,
            patientId: null, // Optional
            items: [
                { drugId: (await prisma.drug.findFirst()).id, quantity: 10, sig: 'QD' }
            ],
            instructions: 'Test Rx',
            totalRefills: 0,
            type: 'ONE_TIME',
            status: 'VERIFIED' // Simulate Verified state
        };

        const rx = await prescriptionService.createPrescription(rxData, realUserId);
        console.log(`Prescription created: ${rx.id} with status ${rx.status}`);

        // Manually update status to VERIFIED if createPrescription didn't (it creates as DRAFT usually, but we passed status?)
        // createPrescription uses the passed status if provided.
        // Let's verify status
        if (rx.status !== 'VERIFIED') {
            await prisma.prescription.update({ where: { id: rx.id }, data: { status: 'VERIFIED' } });
            console.log('Updated status to VERIFIED');
        }

        console.log('2. Verifying Refill #0...');
        const refill = await prisma.refill.findFirst({ where: { prescriptionId: rx.id, refillNumber: 0 } });
        console.log(`Refill #0: Qty ${refill.authorizedQty}, Remaining ${refill.remainingQty}, Status ${refill.status}`);

        console.log('3. Simulating Full Dispense (Sale)...');
        // We will directly call updateRefillAfterDispense to simulate what saleService does
        const dispensedQty = 10;
        await refillService.updateRefillAfterDispense(refill.id, dispensedQty);

        const updatedRefill = await prisma.refill.findUnique({ where: { id: refill.id } });
        console.log(`Refill Updated: Remaining ${updatedRefill.remainingQty}, Status ${updatedRefill.status}`);

        if (updatedRefill.status !== 'FULLY_USED') {
            console.error('❌ FAILURE: Refill status is NOT FULLY_USED');
        } else {
            console.log('✅ Refill status is FULLY_USED');
        }

        console.log('4. Updating Prescription Status...');
        const newStatus = await prescriptionService.updatePrescriptionStatus(rx.id, realUserId);
        console.log(`New Prescription Status: ${newStatus}`);

        const finalRx = await prisma.prescription.findUnique({ where: { id: rx.id } });
        console.log(`Final Database Status: ${finalRx.status}`);

        if (finalRx.status !== 'COMPLETED') {
            console.error('❌ FAILURE: Prescription status is NOT COMPLETED');
        } else {
            console.log('✅ SUCCESS: Prescription status is COMPLETED');
        }

        // Cleanup? No need for local dev test
    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
