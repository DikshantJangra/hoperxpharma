const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInventory() {
    try {
        const batch = await prisma.inventoryBatch.findFirst({
            where: {
                batchNumber: 'LLLLLLL'
            },
            include: {
                drug: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!batch) {
            console.log('❌ Inventory batch LLLLLLL NOT FOUND!');
            console.log('\nThis confirms the bug - item was flattened but inventory was not created.');
            return;
        }

        console.log('✅ Inventory batch FOUND!');
        console.log('\nBatch Details:');
        console.log('  Batch Number:', batch.batchNumber);
        console.log('  Drug:', batch.drug.name);
        console.log('  Quantity in Stock:', batch.baseUnitQuantity);
        console.log('  MRP:', batch.mrp);
        console.log('  Purchase Price:', batch.purchasePrice);
        console.log('  Expiry Date:', batch.expiryDate);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkInventory();
