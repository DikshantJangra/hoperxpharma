const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reassignDrugsToUserStore() {
    try {
        console.log('🔄 Reassigning seeded drugs to user store...\n');

        // Get all stores
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
            },
        });

        console.log('📋 Available stores:');
        stores.forEach((store, index) => {
            console.log(`${index + 1}. ${store.displayName || store.name} (${store.email})`);
            console.log(`   ID: ${store.id}\n`);
        });

        // Get the demo store
        const demoStore = stores.find(s => s.email === 'demo@hoperxpharma.com');

        if (!demoStore) {
            console.log('❌ Demo store not found. Please run seed first.');
            return;
        }

        // Get the user's store (first non-demo store)
        const userStore = stores.find(s => s.email !== 'demo@hoperxpharma.com');

        if (!userStore) {
            console.log('⚠️  No user store found. Using demo store only.');
            return;
        }

        console.log(`\n🎯 Reassigning drugs from:`);
        console.log(`   FROM: ${demoStore.displayName} (${demoStore.id})`);
        console.log(`   TO: ${userStore.displayName} (${userStore.id})\n`);

        // Update all drugs from demo store to user store
        const updateDrugs = await prisma.drug.updateMany({
            where: { storeId: demoStore.id },
            data: { storeId: userStore.id },
        });

        // Update all inventory batches from demo store to user store
        const updateBatches = await prisma.inventoryBatch.updateMany({
            where: { storeId: demoStore.id },
            data: { storeId: userStore.id },
        });

        console.log(`✅ Updated ${updateDrugs.count} drugs`);
        console.log(`✅ Updated ${updateBatches.count} inventory batches`);
        console.log(`\n🎉 Done! You can now search for drugs in the New Sale page.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

reassignDrugsToUserStore();
