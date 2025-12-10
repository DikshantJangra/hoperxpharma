const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const stores = await prisma.store.findMany({
            take: 5,
            include: { settings: true }
        });

        console.log('Found', stores.length, 'stores');
        stores.forEach(s => {
            console.log(`Store ID: ${s.id}, Name: ${s.name}`);
            console.log('Settings:', s.settings);
        });

        // Try to find a store and specific settings
        const specificStore = stores[0];
        if (specificStore) {
            console.log('Attempting upsert for store:', specificStore.id);
            const upserted = await prisma.storeSettings.upsert({
                where: { storeId: specificStore.id },
                create: {
                    storeId: specificStore.id,
                    invoiceFormat: 'TEST/{SEQ}',
                    footerText: 'Test Footer'
                },
                update: {
                    invoiceFormat: 'TEST/{SEQ}',
                    footerText: 'Test Footer'
                }
            });
            console.log('Upsert result:', upserted);
        }

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
