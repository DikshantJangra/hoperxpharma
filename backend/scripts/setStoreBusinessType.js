const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Utility script to set business type for existing stores
 * 
 * Usage:
 * node scripts/setStoreBusinessType.js <storeId> <businessType>
 * 
 * Example:
 * node scripts/setStoreBusinessType.js clxyz123 "Retail Pharmacy"
 */

const VALID_BUSINESS_TYPES = [
    "Retail Pharmacy",
    "Wholesale Pharmacy",
    "Hospital-based Pharmacy",
    "Multi-store Chain"
];

async function setStoreBusinessType(storeId, businessType) {
    try {
        // Validate business type
        if (!VALID_BUSINESS_TYPES.includes(businessType)) {
            console.error(`❌ Invalid business type: ${businessType}`);
            console.log(`Valid options: ${VALID_BUSINESS_TYPES.join(', ')}`);
            process.exit(1);
        }

        // Check if store exists
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: {
                id: true,
                name: true,
                businessType: true
            }
        });

        if (!store) {
            console.error(`❌ Store not found: ${storeId}`);
            process.exit(1);
        }

        console.log(`\n📋 Current Store Info:`);
        console.log(`   Name: ${store.name}`);
        console.log(`   Current Business Type: ${store.businessType || 'Not set'}`);
        console.log(`   New Business Type: ${businessType}\n`);

        // Update the store
        const updated = await prisma.store.update({
            where: { id: storeId },
            data: { businessType }
        });

        console.log(`✅ Successfully updated store business type!`);
        console.log(`   Store: ${updated.name}`);
        console.log(`   Business Type: ${updated.businessType}\n`);

    } catch (error) {
        console.error('❌ Error updating store:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function listStoresWithoutBusinessType() {
    try {
        const stores = await prisma.store.findMany({
            where: {
                OR: [
                    { businessType: null },
                    { businessType: '' }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                businessType: true
            }
        });

        if (stores.length === 0) {
            console.log('✅ All stores have business types set!');
            return;
        }

        console.log(`\n📊 Stores without business type (${stores.length}):\n`);
        stores.forEach((store, idx) => {
            console.log(`${idx + 1}. ${store.name}`);
            console.log(`   ID: ${store.id}`);
            console.log(`   Email: ${store.email}`);
            console.log(`   Business Type: ${store.businessType || 'Not set'}\n`);
        });

        console.log(`\nTo set business type, run:`);
        console.log(`node scripts/setStoreBusinessType.js <storeId> "<businessType>"\n`);
        console.log(`Valid business types:`);
        VALID_BUSINESS_TYPES.forEach(type => console.log(`  - "${type}"`));
        console.log('');

    } catch (error) {
        console.error('❌ Error listing stores:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    // No arguments - list stores without business type
    listStoresWithoutBusinessType();
} else if (args.length === 2) {
    // Two arguments - set business type
    const [storeId, businessType] = args;
    setStoreBusinessType(storeId, businessType);
} else {
    console.error('❌ Invalid arguments');
    console.log('\nUsage:');
    console.log('  List stores without business type:');
    console.log('    node scripts/setStoreBusinessType.js\n');
    console.log('  Set business type for a store:');
    console.log('    node scripts/setStoreBusinessType.js <storeId> "<businessType>"\n');
    console.log('Valid business types:');
    VALID_BUSINESS_TYPES.forEach(type => console.log(`  - "${type}"`));
    process.exit(1);
}
