/**
 * Script to fix negative inventory quantities by setting them to 0
 * Run this with: node fix_negative_inventory.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNegativeInventory() {
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
                        name: true
                    }
                }
            }
        });

        if (negativeBatches.length === 0) {
            console.log('✓ No negative inventory found!');
            return;
        }

        console.log(`Found ${negativeBatches.length} batches with negative quantities.\n`);

        console.log('Creating stock adjustment records and fixing quantities...\n');

        let fixedCount = 0;
        for (const batch of negativeBatches) {
            console.log(`Fixing: ${batch.drug.name} (Batch: ${batch.batchNumber})`);
            console.log(`  Current quantity: ${batch.quantityInStock}`);

            // Create stock adjustment record for audit trail
            await prisma.stockMovement.create({
                data: {
                    batchId: batch.id,
                    movementType: 'IN',
                    quantity: Math.abs(batch.quantityInStock),
                    reason: 'Correction: Negative inventory reset to 0',
                    referenceType: 'adjustment'
                }
            });

            // Update batch to 0 using raw SQL to bypass validation
            await prisma.$executeRaw`
                UPDATE "InventoryBatch" 
                SET "quantityInStock" = 0 
                WHERE id = ${batch.id}
            `;

            console.log(`  ✓ Fixed to: 0\n`);
            fixedCount++;
        }

        console.log('═'.repeat(80));
        console.log(`✓ Successfully fixed ${fixedCount} batches`);
        console.log('  All negative quantities have been reset to 0');
        console.log('  Stock movement records created for audit trail');

    } catch (error) {
        console.error('✗ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixNegativeInventory();
