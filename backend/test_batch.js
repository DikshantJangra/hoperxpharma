
const database = require('./src/config/database');
const inventoryRepository = require('./src/repositories/inventoryRepository');
const prisma = database.getClient();

async function testFilter() {
    try {
        console.log('--- Starting Test ---');
        // 1. Create a dummy drug
        const drug = await prisma.drug.create({
            data: {
                name: 'Test Drug Filter ' + Date.now(),
                manufacturer: 'Test Pharma',
                hsnCode: '1234',
                type: 'TABLET',
                storeId: 'test-store-id-123',
                gstRate: 5,
                schedule: 'H',
            }
        });

        console.log('Created Drug:', drug.id);

        // 2. Create 0 quantity batch (older expiry)
        await prisma.inventoryBatch.create({
            data: {
                drugId: drug.id,
                batchNumber: 'BATCH-0',
                quantityInStock: 0,
                expiryDate: new Date('2024-01-01'), // Old
                storeId: 'test-store-id-123',
                mrp: 100,
                purchasePrice: 50,
                location: 'A1'
            }
        });

        // 3. Create 10 quantity batch (newer expiry)
        await prisma.inventoryBatch.create({
            data: {
                drugId: drug.id,
                batchNumber: 'BATCH-10',
                quantityInStock: 10,
                expiryDate: new Date('2025-01-01'), // New
                storeId: 'test-store-id-123',
                mrp: 100,
                purchasePrice: 50,
                location: 'A2'
            }
        });

        // 4. Call findBatchesForDispense
        console.log('Searching batches with findBatchesForDispense...');
        const batches = await inventoryRepository.findBatchesForDispense('test-store-id-123', drug.id, 10);

        console.log('Found Batches:', batches.map(b => `${b.batchNumber} (Qty: ${b.quantityInStock})`));

        const zeroBatch = batches.find(b => b.quantityInStock === 0);
        if (zeroBatch) {
            console.error('FAIL: Found 0 quantity batch!', zeroBatch);
        } else {
            console.log('PASS: No 0 quantity batches found.');
            if (batches.length > 0 && batches[0].batchNumber === 'BATCH-10') {
                console.log('PASS: Correct positive stock batch found first.');
            } else {
                console.warn('WARN: Expected BATCH-10 as first result.');
            }
        }

        // Clean up
        console.log('Cleaning up...');
        await prisma.inventoryBatch.deleteMany({ where: { drugId: drug.id } });
        await prisma.drug.delete({ where: { id: drug.id } });

    } catch (e) {
        console.error('Test Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testFilter();
