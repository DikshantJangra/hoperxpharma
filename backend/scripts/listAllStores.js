const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllStores() {
    try {
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                businessType: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`\n📊 All Stores (${stores.length} total):\n`);

        if (stores.length === 0) {
            console.log('No stores found in database.\n');
            return;
        }

        stores.forEach((store, idx) => {
            console.log(`${idx + 1}. ${store.name}`);
            console.log(`   ID: ${store.id}`);
            console.log(`   Email: ${store.email}`);
            console.log(`   Business Type: ${store.businessType || '❌ Not set'}`);
            console.log(`   Created: ${store.createdAt.toLocaleDateString()}\n`);
        });

        // Summary by business type
        const byType = stores.reduce((acc, store) => {
            const type = store.businessType || 'Not set';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        console.log('📈 Summary by Business Type:');
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ Error listing stores:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

listAllStores();
