const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBarcode() {
    const barcode = '012462';
    console.log(`Checking DB for barcode: ${barcode}`);

    // 1. Check Registry
    const registry = await prisma.barcodeRegistry.findUnique({
        where: { barcode },
        include: { batch: true }
    });
    console.log('Registry Entry:', registry ? 'FOUND' : 'NOT FOUND');
    if (registry) console.log(JSON.stringify(registry, null, 2));

    // 2. Check GRN Items
    const grnItems = await prisma.gRNItem.findMany({
        where: { manufacturerBarcode: barcode },
        include: { grn: true }
    });
    console.log('GRN Items:', grnItems.length);
    if (grnItems.length > 0) {
        console.log(JSON.stringify(grnItems, null, 2));
    } else {
        // Broad search in GRN Items just in case
        console.log('Performing broad GRN Item search...');
        const allGrnItems = await prisma.gRNItem.findMany({
            take: 50,
            orderBy: { id: 'desc' },
            select: { id: true, manufacturerBarcode: true, batchNumber: true }
        });
        console.log('Recent GRN Items:', JSON.stringify(allGrnItems, null, 2));
    }

    // 3. Check Inventory Batches with that barcode (if column exists and was populated)
    // Note: I added manufacturerBarcode to InventoryBatch in my plan, let's see if it's there
    try {
        const batches = await prisma.inventoryBatch.findMany({
            where: { manufacturerBarcode: barcode }
        });
        console.log('Inventory Batches with barcode:', batches.length);
        if (batches.length > 0) console.log(JSON.stringify(batches, null, 2));
    } catch (e) {
        console.log('Error querying InventoryBatch.manufacturerBarcode (maybe column missing?):', e.message);
    }
}

checkBarcode()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
