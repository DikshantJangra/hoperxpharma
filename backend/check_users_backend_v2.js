
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('--- Checking User-Store Associations ---');

        const users = await prisma.user.findMany({
            include: {
                storeUsers: {
                    include: { store: true }
                }
            }
        });

        users.forEach(u => {
            console.log(`User: ${u.firstName} ${u.lastName} (${u.email})`);

            const primaryStoreUser = u.storeUsers.find(su => su.isPrimary);

            if (primaryStoreUser) {
                console.log(`  Primary Store: ${primaryStoreUser.store.name} (ID: ${primaryStoreUser.store.id})`);
            } else {
                console.log(`  Primary Store: NONE (Derived from first valid link)`);
            }

            if (u.storeUsers.length > 0) {
                console.log(`  Linked Stores:`);
                u.storeUsers.forEach(su => {
                    const isPrimary = su.isPrimary ? '(PRIMARY)' : '';
                    console.log(`    - ${su.store.name} (ID: ${su.store.id}) ${isPrimary}`);
                });
            } else {
                console.log(`  Linked Stores: NONE`);
            }
            console.log('-----------------------------------');
        });

        console.log('\n--- Checking Common Store ID ---');
        // Check the store ID from previous GRNs
        const storeId = 'cmiupfrm2000q14tqyirzs5rz'; // From previous script output
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (store) {
            console.log(`Target Store from GRNs: ${store.name} (ID: ${store.id})`);
        } else {
            console.log(`Target Store from GRNs (ID: ${storeId}) NOT FOUND`);
        }


    } catch (error) {
        console.error('Error querying database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
