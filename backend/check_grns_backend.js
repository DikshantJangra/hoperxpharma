
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGRNs() {
    try {
        console.log('--- Checking GoodsReceivedNote (GRN) Data ---');

        // List Stores
        const stores = await prisma.store.findMany();
        console.log('\n--- Stores ---');
        stores.forEach(s => console.log(`ID: ${s.id}, Name: ${s.name}`));

        // List Recent Completed GRNs
        const recentGRNs = await prisma.goodsReceivedNote.findMany({
            where: { status: 'COMPLETED' },
            take: 5,
            orderBy: { receivedDate: 'desc' },
            include: {
                ConsolidatedInvoiceGRN: true,
                supplier: true
            }
        });

        console.log('\n--- Recent 5 Completed GRNs ---');
        recentGRNs.forEach(grn => {
            const invoiceCount = grn.ConsolidatedInvoiceGRN.length;
            console.log(`ID: ${grn.id}`);
            console.log(`  Store ID: ${grn.storeId}`);
            console.log(`  Supplier: ${grn.supplier.name} (ID: ${grn.supplierId})`);
            console.log(`  Date: ${grn.receivedDate}`);
            console.log(`  Invoiced: ${invoiceCount > 0 ? 'YES' : 'NO'}`);
            console.log('-----------------------------------');
        });

    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGRNs();
