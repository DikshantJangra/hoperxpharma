const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'Testuser1@gmail.com' },
            include: {
                storeUsers: {
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('\n=== USER ===');
        console.log('Email:', user.email);
        console.log('Stores:', user.storeUsers.length);

        user.storeUsers.forEach(su => {
            console.log(`\n- ${su.store.name} (${su.store.id})`);
            console.log(`  Primary: ${su.isPrimary}`);
        });

        const primaryStore = user.storeUsers.find(su => su.isPrimary);
        if (primaryStore) {
            console.log('\n=== PRIMARY STORE ===');
            console.log(primaryStore.store.name, `(${primaryStore.store.id})`);

            // Check if batch LLLLLLL is in this store
            const batch = await prisma.inventoryBatch.findFirst({
                where: {
                    batchNumber: 'LLLLLLL',
                    storeId: primaryStore.store.id
                }
            });

            if (batch) {
                console.log('\n✅ Batch LLLLLLL IS in this user\'s primary store!');
                console.log('Quantity:', batch.quantityInStock);
            } else {
                console.log('\n❌ Batch LLLLLLL is NOT in this user\'s primary store!');

                // Find which store it's in
                const actualBatch = await prisma.inventoryBatch.findFirst({
                    where: { batchNumber: 'LLLLLLL' },
                    include: {
                        store: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                if (actualBatch) {
                    console.log(`It's in: ${actualBatch.store.name}`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
