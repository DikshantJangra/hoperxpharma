const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupInventory() {
    console.log('🧹 Cleaning up test inventory...\n');

    const storeId = 'cmiudrdtm002bbg2b32g7jd0o';

    // First, delete related purchase order items
    const poItems = await prisma.purchaseOrderItem.deleteMany({
        where: {
            drug: {
                storeId
            }
        }
    });
    console.log(`✅ Deleted ${poItems.count} purchase order item(s)`);

    // Then delete inventory batches
    const batches = await prisma.inventoryBatch.deleteMany({
        where: {
            drug: {
                storeId
            }
        }
    });
    console.log(`✅ Deleted ${batches.count} inventory batch(es)`);

    // Finally, delete the drugs
    const drugs = await prisma.drug.deleteMany({
        where: { storeId }
    });
    console.log(`✅ Deleted ${drugs.count} drug(s) from Dikshant's Pharmacy`);
    console.log('\n✨ Store now has empty inventory.\n');

    await prisma.$disconnect();
}

cleanupInventory().catch(console.error);
