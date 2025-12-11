/**
 * Script to apply database CHECK constraint for preventing negative inventory
 * Run this with: node apply_inventory_constraint.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyConstraint() {
    try {
        console.log('Applying CHECK constraint to InventoryBatch table...');

        await prisma.$executeRaw`
            ALTER TABLE "InventoryBatch" 
            ADD CONSTRAINT "InventoryBatch_quantityInStock_check" 
            CHECK ("quantityInStock" >= 0)
        `;

        console.log('✓ CHECK constraint successfully applied!');
        console.log('  - Constraint name: InventoryBatch_quantityInStock_check');
        console.log('  - Rule: quantityInStock must be >= 0');

    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('✓ Constraint already exists, no action needed.');
        } else {
            console.error('✗ Failed to apply constraint:', error.message);
            throw error;
        }
    } finally {
        await prisma.$disconnect();
    }
}

applyConstraint();
