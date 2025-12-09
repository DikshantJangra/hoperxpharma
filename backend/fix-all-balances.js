const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAllBalances() {
    try {
        console.log("Starting Global Balance Recalculation...");

        const patients = await prisma.patient.findMany({
            where: { deletedAt: null }
        });

        console.log(`Found ${patients.length} patients.`);

        for (const patient of patients) {
            // Aggregate Unpaid Sales
            const result = await prisma.sale.aggregate({
                where: {
                    patientId: patient.id,
                    paymentStatus: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
                    deletedAt: null
                },
                _sum: {
                    balance: true
                }
            });

            const trueBalance = Number(result._sum.balance || 0);
            const currentStoredBalance = Number(patient.currentBalance || 0);

            if (Math.abs(trueBalance - currentStoredBalance) > 0.01) {
                console.log(`[FIX] Patient ${patient.firstName} (${patient.id}): Stored=${currentStoredBalance} -> True=${trueBalance}`);

                await prisma.patient.update({
                    where: { id: patient.id },
                    data: { currentBalance: trueBalance }
                });
            } else {
                // console.log(`[OK] Patient ${patient.firstName}: Balance matches (${trueBalance})`);
            }
        }

        console.log("Global Recalculation Complete.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAllBalances();
