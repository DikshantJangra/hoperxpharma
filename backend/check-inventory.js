const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInventory() {
    console.log('🔍 Checking inventory in database...\n');

    // Get all stores
    const stores = await prisma.store.findMany({
        select: {
            id: true,
            name: true,
            displayName: true,
            createdAt: true,
        }
    });

    console.log(`📦 Found ${stores.length} store(s):\n`);

    for (const store of stores) {
        console.log(`Store: ${store.displayName || store.name} (ID: ${store.id})`);
        console.log(`Created: ${store.createdAt}`);

        // Count drugs for this store
        const drugCount = await prisma.drug.count({
            where: { storeId: store.id }
        });

        console.log(`Drugs: ${drugCount}`);

        if (drugCount > 0) {
            const drugs = await prisma.drug.findMany({
                where: { storeId: store.id },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                }
            });

            drugs.forEach(drug => {
                console.log(`  - ${drug.name} (created: ${drug.createdAt})`);
            });
        }

        console.log('---\n');
    }

    await prisma.$disconnect();
}

checkInventory().catch(console.error);
