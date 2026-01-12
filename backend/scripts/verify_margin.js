const { PrismaClient } = require('@prisma/client');
const marginService = require('../src/services/margin/marginService');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Margin Validation...');

    // 1. Find a recent sale to test with
    const sale = await prisma.sale.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { items: true }
    });

    if (!sale) {
        console.log('No sales found to test.');
        return;
    }

    console.log(`Testing with Sale ID: ${sale.id}`);

    // 2. Run Margin Calculation
    console.log('Running calculateAndRecordSaleMargin...');
    await marginService.calculateAndRecordSaleMargin(sale.id, sale.storeId);

    // 3. Verify Ledger Entries
    const entries = await prisma.marginLedger.findMany({
        where: { saleId: sale.id }
    });

    console.log(`Ledger Entries Found: ${entries.length}`);
    if (entries.length > 0) {
        console.log('Sample Entry:', entries[0]);
    } else {
        console.error('FAILED: No ledger entries created.');
    }

    // 4. Verify Aggregation
    console.log('Verifying Aggregation...');
    const stats = await marginService.getMarginForSale(sale.id);
    console.log('Sale Margin Stats:', stats);

    console.log('Verification Complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
