const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStoreSettings() {
    try {
        console.log('=== Checking Store Settings ===\n');

        // Get all stores
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true,
                settings: true
            }
        });

        console.log(`Found ${stores.length} store(s):\n`);

        for (const store of stores) {
            console.log(`Store: ${store.name} (ID: ${store.id})`);

            if (store.settings) {
                console.log('  ✓ Has storeSettings');
                console.log('  Settings:', JSON.stringify(store.settings, null, 2));
            } else {
                console.log('  ✗ Missing storeSettings - THIS IS THE ISSUE!');
                console.log('  Creating default settings...');

                const created = await prisma.storeSettings.create({
                    data: {
                        storeId: store.id,
                        defaultGSTSlab: '5',
                        defaultUoM: 'Units',
                        batchTracking: true,
                        autoGenerateCodes: true,
                        purchaseRounding: true,
                        allowNegativeStock: false,
                        invoiceFormat: 'INV-{YY}{MM}-{SEQ:4}',
                        workbenchMode: 'SIMPLE',
                        autoRounding: true,
                        enableGSTBilling: true
                    }
                });

                console.log('  ✓ Created default settings:', created.id);
            }
            console.log('');
        }

        console.log('=== Check Complete ===');
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkStoreSettings();
