const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkParacetamolDrug() {
    try {
        const drugs = await prisma.drug.findMany({
            where: {
                name: {
                    contains: 'Paracetamol Tablet'
                }
            },
            select: {
                id: true,
                name: true,
                storeId: true,
                store: {
                    select: {
                        name: true
                    }
                }
            }
        });

        console.log('\n=== PARACETAMOL TABLET DRUGS ===');
        drugs.forEach(drug => {
            console.log(`Drug: ${drug.name}`);
            console.log(`  Store: ${drug.store.name} (${drug.storeId})`);
        });

        const correctStoreId = 'cmiupfrm2000q14tqyirzs5rz';
        const inCorrectStore = drugs.find(d => d.storeId === correctStoreId);

        if (inCorrectStore) {
            console.log(`\n✅ Paracetamol Tablet IS in the correct store`);
        } else {
            console.log(`\n❌ Paracetamol Tablet is NOT in store ${correctStoreId}`);
            console.log('It\'s in a different store!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkParacetamolDrug();
