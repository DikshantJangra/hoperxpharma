const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_STORE_ID = 'cmiupfrm2000q14tqyirzs5rz'; // User's test store ID

async function main() {
    console.log(`Checking store: ${TARGET_STORE_ID}...`);
    try {
        const store = await prisma.store.findUnique({
            where: { id: TARGET_STORE_ID },
            include: { settings: true }
        });

        if (!store) {
            console.error('Store not found!');
            return;
        }

        console.log('Current Settings:', store.settings);

        console.log('Upserting default settings...');
        const result = await prisma.storeSettings.upsert({
            where: { storeId: TARGET_STORE_ID },
            create: {
                storeId: TARGET_STORE_ID,
                invoiceFormat: 'INV/{YYYY}/{SEQ:4}',
                footerText: 'Thank you for your business!'
            },
            update: {
                // Only update if null/empty, or force set to defaults to ensure visibility
                invoiceFormat: 'INV/{YYYY}/{SEQ:4}',
                footerText: 'Thank you for your business!'
            }
        });

        console.log('Success! Settings upserted:', result);

        // Verify fetch
        const verify = await prisma.store.findUnique({
            where: { id: TARGET_STORE_ID },
            include: { settings: true }
        });
        console.log('Verified Settings in Store:', verify.settings);

    } catch (e) {
        console.error('DB Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
