/**
 * Add Database Indexes for PostgreSQL Search Performance
 * 
 * This script adds indexes to MedicineMaster table to speed up search queries
 * Run this after switching to PostgreSQL search
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSearchIndexes() {
    console.log('🔍 Adding search indexes to MedicineMaster table...');
    console.log('');

    try {
        // Add indexes for commonly searched fields
        console.log('1️⃣ Adding index on name (case-insensitive)...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_name_idx" 
            ON "MedicineMaster" (LOWER("name"));
        `;
        console.log('✅ Name index created');

        console.log('2️⃣ Adding index on genericName (case-insensitive)...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_genericName_idx" 
            ON "MedicineMaster" (LOWER("genericName"));
        `;
        console.log('✅ Generic name index created');

        console.log('3️⃣ Adding index on compositionText (case-insensitive)...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_compositionText_idx" 
            ON "MedicineMaster" (LOWER("compositionText"));
        `;
        console.log('✅ Composition text index created');

        console.log('4️⃣ Adding index on manufacturerName (case-insensitive)...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_manufacturerName_idx" 
            ON "MedicineMaster" (LOWER("manufacturerName"));
        `;
        console.log('✅ Manufacturer name index created');

        console.log('5️⃣ Adding index on primaryBarcode...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_primaryBarcode_idx" 
            ON "MedicineMaster" ("primaryBarcode");
        `;
        console.log('✅ Barcode index created');

        console.log('6️⃣ Adding index on status...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_status_idx" 
            ON "MedicineMaster" ("status");
        `;
        console.log('✅ Status index created');

        console.log('7️⃣ Adding index on usageCount (for sorting)...');
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "MedicineMaster_usageCount_idx" 
            ON "MedicineMaster" ("usageCount" DESC);
        `;
        console.log('✅ Usage count index created');

        console.log('');
        console.log('✅ All search indexes created successfully!');
        console.log('');
        console.log('Search performance should now be significantly improved.');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test search: curl "http://localhost:5000/api/v1/medicines/search?q=paracetamol"');
        console.log('2. Deploy to production');
        console.log('');

    } catch (error) {
        console.error('❌ Failed to create indexes:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    addSearchIndexes()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { addSearchIndexes };
