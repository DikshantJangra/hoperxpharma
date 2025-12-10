// Direct database check for bankDetails
const prisma = require('./src/config/database').getClient();

async function checkBankDetails() {
    const storeId = 'cmj05wyqo0001149rer0lp7mr';

    try {
        console.log('=== DIRECT DATABASE QUERY ===\n');

        // Raw query
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                name: true,
                bankDetails: true,
                logoUrl: true,
                signatureUrl: true,
                settings: true
            }
        });

        console.log('Store ID:', store.id);
        console.log('Store Name:', store.name);
        console.log('\n--- bankDetails field ---');
        console.log('Raw value:', store.bankDetails);
        console.log('Type:', typeof store.bankDetails);
        console.log('Is null?', store.bankDetails === null);
        console.log('Is undefined?', store.bankDetails === undefined);

        if (store.bankDetails) {
            console.log('\nParsed bankDetails:');
            console.log(JSON.stringify(store.bankDetails, null, 2));
            console.log('\nUPI ID:', store.bankDetails.upiId);
        } else {
            console.log('\n⚠️ bankDetails is NULL/UNDEFINED in database');
        }

        console.log('\n--- Other fields ---');
        console.log('logoUrl:', store.logoUrl);
        console.log('signatureUrl:', store.signatureUrl);
        console.log('settings exists?', !!store.settings);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBankDetails();
