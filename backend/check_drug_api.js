const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrugAPI() {
    try {
        // Simulate what the API does
        const drugs = await prisma.drug.findMany({
            where: {
                name: {
                    contains: 'Paracetamol'
                }
            },
            include: {
                inventory: {
                    where: {
                        storeId: 'cmiupfrm2000q14tqyirzs5rz' // Test Pharmacy Name
                    }
                }
            }
        });

        console.log('\n=== DRUGS API RESULT ===');
        drugs.forEach(drug => {
            console.log(`\nDrug: ${drug.name}`);
            console.log(`Inventory batches: ${drug.inventory.length}`);
            drug.inventory.forEach(batch => {
                console.log(`  - Batch ${batch.batchNumber}: ${batch.quantityInStock} units`);
            });
        });

        // Check if LLLLLLL is there
        const hasLLLLLLL = drugs.some(d =>
            d.inventory.some(b => b.batchNumber === 'LLLLLLL')
        );

        console.log(`\n${hasLLLLLLL ? '✅' : '❌'} Batch LLLLLLL found in API result`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDrugAPI();
