
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDrug() {
    const searchTerm = 'Aerotide';
    console.log(`Searching for '${searchTerm}'...`);

    const drugs = await prisma.drug.findMany({
        where: {
            name: { contains: searchTerm, mode: 'insensitive' }
        },
        include: {
            inventory: true,
            saltLinks: {
                include: {
                    salt: true
                }
            }
        }
    });

    console.log(`Found ${drugs.length} drugs.`);

    if (drugs.length > 0) {
        drugs.forEach(drug => {
            console.log('\n--- DRUG FOUND ---');
            console.log(`ID: ${drug.id}`);
            console.log(`Name: ${drug.name}`);
            console.log(`Store ID: ${drug.storeId}`);
            console.log(`Total Stock (calculated): ${drug.inventory.reduce((sum, b) => sum + b.baseUnitQuantity, 0)}`);
            console.log('Inventory Batches:', drug.inventory.length);
            drug.inventory.forEach(b => {
                console.log(` - Batch: ${b.batchNumber}, Stock: ${b.baseUnitQuantity}, StoreId: ${b.storeId}, Deleted: ${b.deletedAt}`);
            });
            console.log('Salts:', drug.saltLinks.map(l => l.salt.name).join(', '));
        });
    } else {
        console.log('❌ Drug not found. Try searching for partial name?');
        const allDrugs = await prisma.drug.findMany({ take: 5 });
        console.log('First 5 drugs in DB:', allDrugs.map(d => d.name));
    }
}

debugDrug()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
