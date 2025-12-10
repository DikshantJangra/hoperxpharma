// Directly update the store's bankDetails for testing
const prisma = require('./src/config/database').getClient();

async function updateStoreBankDetails() {
    const storeId = 'cmj05wyqo0001149rer0lp7mr'; // Your current store
    const upiId = 'dikshant@paytm'; // Test UPI ID

    try {
        console.log('Updating store:', storeId);
        console.log('Setting UPI ID:', upiId);

        const updated = await prisma.store.update({
            where: { id: storeId },
            data: {
                bankDetails: {
                    upiId: upiId
                }
            }
        });

        console.log('\n✅ Updated successfully!');
        console.log('New bankDetails:', updated.bankDetails);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateStoreBankDetails();
