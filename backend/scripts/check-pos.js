const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Purchase Orders...');

        // Get all POs
        const allPOs = await prisma.purchaseOrder.findMany({
            include: {
                supplier: true,
                store: true
            }
        });

        console.log(`Found ${allPOs.length} POs in total.`);

        allPOs.forEach(po => {
            console.log(`PO ID: ${po.id}`);
            console.log(`  Number: ${po.poNumber}`);
            console.log(`  Status: ${po.status}`);
            console.log(`  Store ID: ${po.storeId} (${po.store.name})`);
            console.log(`  Supplier: ${po.supplier.name}`);
            console.log(`  Created: ${po.createdAt}`);
            console.log('---');
        });

        // Get all users and their stores to verify access
        const users = await prisma.user.findMany({
            include: {
                storeUsers: {
                    include: {
                        store: true
                    }
                }
            }
        });

        console.log('\nUser Access:');
        users.forEach(u => {
            console.log(`User: ${u.email} (${u.role})`);
            u.storeUsers.forEach(su => {
                console.log(`  - Store: ${su.store.name} (${su.store.id}) IsPrimary: ${su.isPrimary}`);
            });
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
