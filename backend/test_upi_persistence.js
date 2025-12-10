// Test script to verify UPI ID persistence
const storeApi = require('./src/repositories/storeRepository');
const prisma = require('./src/db/prisma');

async function testUPIPersistence() {
    try {
        console.log('=== Testing UPI ID Persistence ===\n');

        // Get the first store
        const stores = await prisma.store.findMany({ take: 1 });
        if (stores.length === 0) {
            console.log('No stores found');
            return;
        }

        const storeId = stores[0].id;
        console.log('Testing with store:', storeId);
        console.log('Current bankDetails:', stores[0].bankDetails);
        console.log('Current logoUrl:', stores[0].logoUrl);
        console.log('Current signatureUrl:', stores[0].signatureUrl);

        // Test 1: Update UPI ID
        console.log('\n--- Test 1: Updating UPI ID ---');
        const updateData = {
            bankDetails: {
                upiId: 'test@paytm'
            }
        };

        const updated = await storeApi.updateStore(storeId, updateData);
        console.log('After update - bankDetails:', updated.bankDetails);

        // Test 2: Fetch again to verify persistence
        console.log('\n--- Test 2: Fetching again ---');
        const refetched = await storeApi.findById(storeId);
        console.log('Refetched - bankDetails:', refetched.bankDetails);

        if (refetched.bankDetails?.upiId === 'test@paytm') {
            console.log('\n✅ SUCCESS: UPI ID persisted correctly!');
        } else {
            console.log('\n❌ FAILED: UPI ID not persisted');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testUPIPersistence();
