const { PrismaClient } = require('@prisma/client');
const { PERMISSION_METADATA } = require('../../src/constants/permissions');

const prisma = new PrismaClient();

async function seedPermissions() {
    console.log('🌱 Seeding permissions...');

    for (const perm of PERMISSION_METADATA) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {
                name: perm.name,
                description: perm.description,
                category: perm.category,
                resource: perm.resource,
            },
            create: {
                code: perm.code,
                name: perm.name,
                description: perm.description,
                category: perm.category,
                resource: perm.resource,
            },
        });
    }

    console.log(`✅ Seeded ${PERMISSION_METADATA.length} permissions`);
}

async function main() {
    try {
        await seedPermissions();
        console.log('✅ Permission seeding completed successfully');
    } catch (error) {
        console.error('❌ Error seeding permissions:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    main()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { seedPermissions };
