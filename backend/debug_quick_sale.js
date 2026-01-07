const prisma = require('./src/db/prisma');
const saleService = require('./src/services/sales/saleService');

async function debugQuickSale() {
    try {
        console.log('--- STARTING DEBUG ---');

        // 1. Find a valid store
        const store = await prisma.store.findFirst({
            where: { email: { contains: 'test.hoperx.com' } }
        });

        if (!store) {
            console.error('No test store found');
            return;
        }
        console.log(`Using Store: ${store.id} (${store.name})`);

        // 2. Find a valid batch/drug
        const batch = await prisma.inventoryBatch.findFirst({
            where: { storeId: store.id, quantityInStock: { gt: 0 } },
            include: { drug: true }
        });

        if (!batch) {
            console.error('No inventory batch found');
            return;
        }
        console.log(`Using Batch: ${batch.id}, Drug: ${batch.drugId}, MRP: ${batch.mrp}`);

        // 3. Find a user
        const user = await prisma.user.findFirst({
            where: { storeUsers: { some: { storeId: store.id } } }
        });

        if (!user) {
            console.error('No store user found');
            return;
        }
        console.log(`Using User: ${user.id}`);

        // 4. Construct sale data
        // Matches createQuickSale inputs
        const saleData = {
            storeId: store.id,
            items: [{
                drugId: batch.drugId,
                batchId: batch.id,
                quantity: 1,
                mrp: parseFloat(batch.mrp),
                discount: 0
            }],
            paymentSplits: [{
                method: 'CASH',
                amount: parseFloat(batch.mrp)
            }]
        };

        console.log('Calling createQuickSale with:', JSON.stringify(saleData, null, 2));

        // 5. Call function
        const sale = await saleService.createQuickSale(saleData, user.id);

        console.log('SUCCESS! Sale created:', sale.id, sale.invoiceNumber);

    } catch (error) {
        console.error('\n!!! ERROR CAUGHT !!!');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        if (error.cause) console.error('Cause:', error.cause);
    } finally {
        await prisma.$disconnect();
    }
}

debugQuickSale();
