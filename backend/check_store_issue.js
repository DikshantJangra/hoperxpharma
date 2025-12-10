const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStoreIssue() {
    try {
        // Find store by name
        const displayStore = await prisma.store.findFirst({
            where: {
                OR: [
                    { name: { contains: 'Test Display' } },
                    { city: 'Test City' }
                ]
            }
        });

        console.log('\n=== STORE IN UI ===');
        if (displayStore) {
            console.log('Name:', displayStore.name);
            console.log('ID:', displayStore.id);
            console.log('City:', displayStore.city);
        } else {
            console.log('Store not found');
        }

        // Find the correct store
        const correctStore = await prisma.store.findUnique({
            where: { id: 'cmiupfrm2000q14tqyirzs5rz' }
        });

        console.log('\n=== CORRECT STORE (with batch LLLLLLL) ===');
        console.log('Name:', correctStore.name);
        console.log('ID:', correctStore.id);

        // Check user's store assignment
        const user = await prisma.user.findUnique({
            where: { email: 'Testuser1@gmail.com' },
            include: {
                storeUsers: {
                    include: {
                        store: true
                    }
                }
            }
        });

        console.log('\n=== USER STORES ===');
        user.storeUsers.forEach(su => {
            console.log(`- ${su.store.name} (${su.store.id}) - Primary: ${su.isPrimary}`);
        });

        if (displayStore && displayStore.id !== correctStore.id) {
            console.log('\n❌ PROBLEM: You are viewing the WRONG store!');
            console.log(`UI shows: ${displayStore.name}`);
            console.log(`Batch is in: ${correctStore.name}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStoreIssue();
