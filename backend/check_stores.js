const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStores() {
    try {
        // Get all stores
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                name: true
            }
        });

        console.log('\n=== ALL STORES ===');
        stores.forEach(store => {
            console.log(`- ${store.name} (${store.id})`);
        });

        // Check batch LLLLLLL
        const batch = await prisma.inventoryBatch.findFirst({
            where: { batchNumber: 'LLLLLLL' },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                drug: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!batch) {
            console.log('\n❌ Batch LLLLLLL not found');
            return;
        }

        console.log('\n=== BATCH LLLLLLL ===');
        console.log('Store:', batch.store.name, `(${batch.storeId})`);
        console.log('Drug:', batch.drug.name);
        console.log('Quantity:', batch.quantityInStock);

        // Check GRN
        const grn = await prisma.goodsReceivedNote.findFirst({
            where: { grnNumber: 'GRN2025128869' },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        console.log('\n=== GRN ===');
        console.log('GRN Store:', grn.store.name, `(${grn.storeId})`);
        console.log('Status:', grn.status);

        if (batch.storeId !== grn.storeId) {
            console.log('\n⚠️  STORE MISMATCH!');
            console.log(`Batch is in store: ${batch.store.name}`);
            console.log(`GRN is for store: ${grn.store.name}`);
        } else {
            console.log('\n✅ Stores match');
        }

        // Check all inventory for the drug in all stores
        console.log('\n=== ALL INVENTORY FOR PARACETAMOL ===');
        const allBatches = await prisma.inventoryBatch.findMany({
            where: {
                drug: {
                    name: {
                        contains: 'Paracetamol'
                    }
                }
            },
            include: {
                store: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        allBatches.forEach(b => {
            console.log(`- Batch ${b.batchNumber}: ${b.quantityInStock} units in ${b.store.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStores();
