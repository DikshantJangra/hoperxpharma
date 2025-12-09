
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStoreGRNs() {
    try {
        const storeId = 'cmiudrdtm002bbg2b32g7jd0o'; // Dikshant's Pharmacy
        console.log(`--- Checking GRNs for Store: ${storeId} ---`);

        const count = await prisma.goodsReceivedNote.count({
            where: { storeId: storeId }
        });
        console.log(`Total GRNs: ${count}`);

        const completedCount = await prisma.goodsReceivedNote.count({
            where: {
                storeId: storeId,
                status: 'COMPLETED'
            }
        });
        console.log(`Total COMPLETED GRNs: ${completedCount}`);

        if (completedCount > 0) {
            const grns = await prisma.goodsReceivedNote.findMany({
                where: {
                    storeId: storeId,
                    status: 'COMPLETED'
                },
                take: 5
            });
            console.log(grns);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStoreGRNs();
