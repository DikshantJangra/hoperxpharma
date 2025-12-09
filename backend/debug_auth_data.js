
const userRepository = require('./src/repositories/userRepository');

async function debugAuth() {
    try {
        console.log('--- Debugging Auth Logic ---');

        // Find user by email to get ID (assuming Dikshant is the user)
        const email = 'dikshant.jangra@example.com'; // Trying to guess or find a known email
        // Or better, list all users and run the logic for each

        const users = await userRepository.findAll();

        console.log(`Found ${users.length} users.`);

        for (const u of users) {
            const fullUser = await userRepository.findById(u.id);

            console.log(`\nUser: ${fullUser.firstName} ${fullUser.lastName} (${fullUser.email})`);
            console.log(`StoreUsers Count: ${fullUser.storeUsers?.length}`);

            const primaryStoreUser = fullUser.storeUsers?.find(su => su.isPrimary);
            const storeId = primaryStoreUser?.store.id || fullUser.storeUsers?.[0]?.store.id;

            console.log(`Calculated StoreID: ${storeId}`);

            if (!storeId) {
                console.log('⚠️  WARNING: This user would fail Auth check for storeId!');
            } else {
                console.log('✅ Auth check would pass.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugAuth();
