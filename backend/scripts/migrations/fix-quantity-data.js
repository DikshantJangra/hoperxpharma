const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting quantity data consistency check...');

    const batches = await prisma.inventoryBatch.findMany({
        where: {
            OR: [
                { baseUnitQuantity: null },
                { baseUnitQuantity: 0 }
            ]
        }
    });

    console.log(`Found ${batches.length} batches needing baseUnitQuantity fix.`);

    for (const batch of batches) {
        let baseUnitQuantity = 0;
        const unit = (batch.receivedUnit || 'TABLET').toUpperCase();

        if (unit === 'STRIP' || unit === 'BOX' || unit === 'BOTTLE') {
            if (batch.tabletsPerStrip) {
                baseUnitQuantity = batch.quantityInStock * batch.tabletsPerStrip;
            } else {
                console.warn(`Batch ${batch.batchNumber} (ID: ${batch.id}) has unit ${unit} but no tabletsPerStrip. Defaulting to quantityInStock.`);
                baseUnitQuantity = batch.quantityInStock;
            }
        } else {
            baseUnitQuantity = batch.quantityInStock;
        }

        await prisma.inventoryBatch.update({
            where: { id: batch.id },
            data: { baseUnitQuantity }
        });

        console.log(`Updated batch ${batch.batchNumber}: baseUnitQuantity set to ${baseUnitQuantity}`);
    }

    console.log('Migration completed successfully.');
}

migrate()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
