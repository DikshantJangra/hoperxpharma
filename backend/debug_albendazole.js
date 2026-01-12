const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAlbendazole() {
    try {
        console.log('Searching for drug "Albendazole"...');
        const drugs = await prisma.drug.findMany({
            where: {
                name: { contains: 'Albendazole', mode: 'insensitive' }
            }
        });

        if (drugs.length === 0) {
            console.log('No drug named Albendazole found.');
            return;
        }

        console.log(`Found ${drugs.length} drugs matching "Albendazole":`);
        for (const drug of drugs) {
            console.log(`- ${drug.name} (ID: ${drug.id})`);

            // Check latest batches for this drug
            const batches = await prisma.inventoryBatch.findMany({
                where: { drugId: drug.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            console.log(`  Found ${batches.length} recent batches:`);
            batches.forEach(b => {
                console.log(`    Batch: ${b.batchNumber}, Barcode: ${b.manufacturerBarcode || 'NULL'}, Created: ${b.createdAt}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debugAlbendazole();
