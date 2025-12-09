const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixConstraint() {
    try {
        // Drop the old constraint using raw SQL
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Prescriber" DROP CONSTRAINT IF EXISTS "Prescriber_licenseNumber_key" CASCADE;
        `);
        console.log('✅ Dropped old constraint');

        // Check remaining constraints
        const constraints = await prisma.$queryRawUnsafe(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'public."Prescriber"'::regclass AND contype = 'u'
            ORDER BY conname;
        `);

        console.log('\nRemaining unique constraints:');
        console.table(constraints);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixConstraint();
