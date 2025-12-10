const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrugList() {
    try {
        const storeId = 'cmiupfrm2000q14tqyirzs5rz';

        // Get all drugs with inventory in this store
        const drugs = await prisma.drug.findMany({
            where: {
                inventory: {
                    some: {
                        storeId: storeId,
                        quantityInStock: { gt: 0 }
                    }
                }
            },
            include: {
                inventory: {
                    where: {
                        storeId: storeId
                    }
                }
            },
            take: 50
        });

        console.log(`\n=== DRUGS WITH INVENTORY (Total: ${drugs.length}) ===`);
        drugs.forEach(drug => {
            const totalStock = drug.inventory.reduce((sum, b) => sum + b.quantityInStock, 0);
            console.log(`${drug.name}: ${totalStock} units in ${drug.inventory.length} batches`);
        });

        const paracetamol = drugs.find(d => d.name.includes('Paracetamol Tablet'));
        if (paracetamol) {
            console.log('\n✅ Paracetamol Tablet IS in the list');
            console.log('Batches:', paracetamol.inventory.map(b => b.batchNumber).join(', '));
        } else {
            console.log('\n❌ Paracetamol Tablet is NOT in the list');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDrugList();
