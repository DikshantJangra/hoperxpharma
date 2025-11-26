const { PrismaClient } = require('@prisma/client');
const { seedPermissions } = require('./seeds/permissions');
const { seedRoles } = require('./seeds/roles');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // Seed in order: permissions first, then roles
        await seedPermissions();
        console.log('');
        await seedRoles();

        console.log('\n✅ All seeding completed successfully!');
    } catch (error) {
        console.error('\n❌ Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
