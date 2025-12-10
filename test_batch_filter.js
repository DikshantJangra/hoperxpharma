
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const inventoryRepository = require('./backend/src/repositories/inventoryRepository');

async function testFilter() {
    try {
        // 1. Create a dummy drug
        const drug = await prisma.drug.create({
            data: {
                name: 'Test Drug Filter ' + Date.now(),
                manufacturer: 'Test Pharma',
                hsnCode: '1234',
                type: 'TABLET',
                storeId: 'test-store-id', // Assuming test store exists or create one?
                // Add other required fields if any
            }
        });

        console.log('Created Drug:', drug.id);

        // 2. Create 0 quantity batch (older expiry)
        await prisma.inventoryBatch.create({
            data: {
                drugId: drug.id,
                batchNumber: 'BATCH-0',
                quantityInStock: 0,
                expiryDate: new Date('2024-01-01'),
                storeId: 'test-store-id',
                mrp: 100,
                purchasePrice: 50,
            }
        });

        // 3. Create 10 quantity batch (newer expiry)
        await prisma.inventoryBatch.create({
            data: {
                drugId: drug.id,
                batchNumber: 'BATCH-10',
                quantityInStock: 10,
                expiryDate: new Date('2025-01-01'),
                storeId: 'test-store-id',
                mrp: 100,
                purchasePrice: 50,
            }
        });

        // 4. Call findBatchesForDispense
        console.log('Searching batches...');
        const batches = await inventoryRepository.findBatchesForDispense('test-store-id', drug.id, 10);

        console.log('Found Batches:', batches.map(b => `${b.batchNumber} (Qty: ${b.quantityInStock})`));

        if (batches.find(b => b.quantityInStock === 0)) {
            console.error('FAIL: Found 0 quantity batch!');
        } else {
            console.log('PASS: No 0 quantity batches found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testFilter();
