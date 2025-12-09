
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGRNs() {
    try {
        console.log('--- Checking GoodsReceivedNote (GRN) Data ---');

        // 1. Count all GRNs
        const totalGRNs = await prisma.goodsReceivedNote.count();
        console.log(`Total GRNs in DB: ${totalGRNs}`);

        // 2. Count COMPLETED GRNs
        const completedGRNs = await prisma.goodsReceivedNote.count({
            where: { status: 'COMPLETED' }
        });
        console.log(`Total COMPLETED GRNs: ${completedGRNs}`);

        // 3. List recent COMPLETED GRNs with their dates and invoicing status
        const recentGRNs = await prisma.goodsReceivedNote.findMany({
            where: { status: 'COMPLETED' },
            take: 5,
            orderBy: { receivedDate: 'desc' },
            include: {
                ConsolidatedInvoiceGRN: true
            }
        });

        console.log('\n--- Recent 5 Completed GRNs ---');
        if (recentGRNs.length === 0) {
            console.log('No completed GRNs found.');
        } else {
            recentGRNs.forEach(grn => {
                const invoiceCount = grn.ConsolidatedInvoiceGRN.length;
                const invoices = grn.ConsolidatedInvoiceGRN.map(ci => ci.consolidatedInvoiceId).join(', ');
                console.log(`ID: ${grn.id}`);
                console.log(`  Number: ${grn.grnNumber}`);
                console.log(`  Date: ${grn.receivedDate}`);
                console.log(`  Invoiced: ${invoiceCount > 0 ? 'YES' : 'NO'} (${invoices})`);
                console.log('-----------------------------------');
            });
        }

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGRNs();
