// Debug script to check what getMyStore returns
const prisma = require('./src/config/database').getClient();

async function debugGetMyStore() {
    try {
        console.log('=== Testing getMyStore Data Flow ===\n');

        // Get first user with stores
        const user = await prisma.user.findFirst({
            include: {
                storeUsers: {
                    include: {
                        store: true
                    }
                }
            }
        });

        if (!user) {
            console.log('No users found');
            return;
        }

        console.log('User ID:', user.id);
        console.log('User email:', user.email);
        console.log('Store associations:', user.storeUsers.length);

        if (user.storeUsers.length > 0) {
            const store = user.storeUsers[0].store;
            console.log('\n--- Store Data from DB ---');
            console.log('Store ID:', store.id);
            console.log('Store name:', store.name);
            console.log('Logo URL:', store.logoUrl);
            console.log('Signature URL:', store.signatureUrl);
            console.log('Bank Details:', JSON.stringify(store.bankDetails, null, 2));
            console.log('Bank Details type:', typeof store.bankDetails);
            console.log('Bank Details is null?', store.bankDetails === null);

            if (store.bankDetails) {
                console.log('UPI ID from bankDetails:', store.bankDetails.upiId);
            } else {
                console.log('⚠️ bankDetails is NULL in database!');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugGetMyStore();
