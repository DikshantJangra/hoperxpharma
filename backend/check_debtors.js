const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDebtors() {
    try {
        console.log('Checking for patients with currentBalance > 0...');
        const debtors = await prisma.patient.findMany({
            where: {
                currentBalance: { gt: 0 }
            },
            select: {
                id: true,
                firstName: true,
                currentBalance: true,
                storeId: true
            }
        });

        console.log(`Found ${debtors.length} debtors.`);
        console.log(JSON.stringify(debtors, null, 2));

        // Also check if there are ANY patients
        const totalPatients = await prisma.patient.count();
        console.log(`Total patients in DB: ${totalPatients}`);

    } catch (error) {
        console.error('Error checking debtors:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDebtors();
