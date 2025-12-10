const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrescriptionUpdate() {
    const prescriptionId = 'cmiw0fjmt000014u4wqsl7goh';

    console.log('Testing prescription update with ID:', prescriptionId);

    // Check current status
    const before = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        select: { id: true, status: true, stage: true }
    });

    console.log('Before:', JSON.stringify(before, null, 2));

    // Simulate the repository transaction
    const result = await prisma.$transaction(async (tx) => {
        console.log('🔍 DEBUG Repository: saleData.prescriptionId =', prescriptionId);

        if (prescriptionId) {
            console.log('🔍 DEBUG Repository: Updating prescription status to COMPLETED');
            const updatedRx = await tx.prescription.update({
                where: { id: prescriptionId },
                data: {
                    status: 'COMPLETED',
                    stage: 'DELIVERED',
                    updatedAt: new Date()
                }
            });
            console.log('✅ DEBUG Repository: Prescription updated successfully:', updatedRx.id, 'Status:', updatedRx.status);
        }

        return { success: true };
    });

    // Verify the update
    const after = await prisma.prescription.findUnique({
        where: { id: prescriptionId },
        select: { id: true, status: true, stage: true }
    });

    console.log('\nAfter:', JSON.stringify(after, null, 2));
    console.log('\n✅ Test completed successfully!');
}

testPrescriptionUpdate()
    .catch(e => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
