
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestStoreGRNs() {
    try {
        const storeId = 'cmiupfrm2000q14tqyirzs5rz'; // Test Pharmacy Name (from logs)
        console.log(`--- Checking GRNs for Store: ${storeId} ---`);

        const count = await prisma.goodsReceivedNote.count({
            where: { storeId: storeId }
        });
        console.log(`Total GRNs: ${count}`);

        const completed = await prisma.goodsReceivedNote.findMany({
            where: {
                storeId: storeId,
                status: 'COMPLETED'
            },
            include: {
                ConsolidatedInvoiceGRN: true
            },
            orderBy: { receivedDate: 'desc' }
        });

        console.log(`Total COMPLETED GRNs: ${completed.length}`);

        console.log('\n--- GRN Details (Top 10) ---');
        completed.slice(0, 10).forEach(g => {
            const isInvoiced = g.ConsolidatedInvoiceGRN.length > 0;
            console.log(`GRN: ${g.grnNumber}`);
            console.log(`  Date: ${g.receivedDate}`);
            console.log(`  Status: ${g.status}`);
            console.log(`  Invoiced: ${isInvoiced ? 'YES' : 'NO'} (${g.ConsolidatedInvoiceGRN.length} links)`);
            console.log('---------------------------');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTestStoreGRNs();
