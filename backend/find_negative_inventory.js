/**
 * Script to find and report negative inventory quantities
 * Run this with: node find_negative_inventory.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findNegativeInventory() {
    try {
        console.log('Searching for negative inventory quantities...\n');

        const negativeBatches = await prisma.inventoryBatch.findMany({
            where: {
                quantityInStock: {
                    lt: 0
                }
            },
            include: {
                drug: {
                    select: {
                        name: true,
                        form: true,
                        strength: true
                    }
                }
            },
            orderBy: {
                quantityInStock: 'asc'
            }
        });

        if (negativeBatches.length === 0) {
            console.log('✓ No negative inventory found!');
            return;
        }

        console.log(`Found ${negativeBatches.length} batches with negative quantities:\n`);
        console.log('═'.repeat(80));

        for (const batch of negativeBatches) {
            console.log(`Drug: ${batch.drug.name} ${batch.drug.strength || ''} ${batch.drug.form || ''}`);
            console.log(`Batch: ${batch.batchNumber}`);
            console.log(`Quantity: ${batch.quantityInStock} ❌`);
            console.log(`Batch ID: ${batch.id}`);
            console.log(`Store ID: ${batch.storeId}`);
            console.log('-'.repeat(80));
        }

        console.log('\nSummary:');
        console.log(`  Total batches with negative quantities: ${negativeBatches.length}`);
        console.log(`  Total negative units: ${negativeBatches.reduce((sum, b) => sum + b.quantityInStock, 0)}`);

        console.log('\nRecommended Action:');
        console.log('  Run: node fix_negative_inventory.js to set all negative quantities to 0');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

findNegativeInventory();
