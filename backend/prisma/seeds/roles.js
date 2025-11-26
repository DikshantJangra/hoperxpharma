const { PrismaClient } = require('@prisma/client');
const { USER_ROLES } = require('../../src/constants/roles');

const prisma = new PrismaClient();

// Define built-in roles with their default permissions
const BUILT_IN_ROLES = [
    {
        name: 'ADMIN',
        description: 'Full system administrator with all permissions',
        builtIn: true,
        category: 'system',
        permissions: [
            // Admins get ALL permissions - we'll fetch them dynamically
        ],
    },
    {
        name: 'PHARMACIST',
        description: 'Licensed pharmacist with clinical and dispensing permissions',
        builtIn: true,
        category: 'clinical',
        permissions: [
            'patient.create',
            'patient.read',
            'patient.update',
            'prescription.create',
            'prescription.read',
            'prescription.update',
            'prescription.fulfill',
            'prescription.refill',
            'inventory.read',
            'inventory.update',
            'sales.create',
            'sales.read',
            'sales.refund',
            'po.create',
            'po.read',
            'po.receive',
            'expense.create',
            'expense.read',
            'report.sales',
            'report.inventory',
        ],
    },
    {
        name: 'TECHNICIAN',
        description: 'Pharmacy technician with limited dispensing permissions',
        builtIn: true,
        category: 'clinical',
        permissions: [
            'patient.read',
            'prescription.read',
            'prescription.fulfill',
            'inventory.read',
            'sales.create',
            'sales.read',
            'po.read',
        ],
    },
    {
        name: 'CASHIER',
        description: 'Cashier with sales and basic inventory permissions',
        builtIn: true,
        category: 'administrative',
        permissions: [
            'patient.read',
            'sales.create',
            'sales.read',
            'inventory.read',
        ],
    },
];

async function seedRoles() {
    console.log('🌱 Seeding roles...');

    // Get all permissions for ADMIN role
    const allPermissions = await prisma.permission.findMany();
    const allPermissionCodes = allPermissions.map(p => p.code);

    for (const roleData of BUILT_IN_ROLES) {
        // Use all permissions for ADMIN, otherwise use defined permissions
        const permissionCodes = roleData.name === 'ADMIN'
            ? allPermissionCodes
            : roleData.permissions;

        // Create or update the role
        const role = await prisma.role.upsert({
            where: { name: roleData.name },
            update: {
                description: roleData.description,
                builtIn: roleData.builtIn,
                category: roleData.category,
            },
            create: {
                name: roleData.name,
                description: roleData.description,
                builtIn: roleData.builtIn,
                category: roleData.category,
            },
        });

        // Get permission IDs
        const permissions = await prisma.permission.findMany({
            where: {
                code: {
                    in: permissionCodes,
                },
            },
        });

        // Delete existing role-permission mappings
        await prisma.rolePermission.deleteMany({
            where: { roleId: role.id },
        });

        // Create new role-permission mappings
        for (const permission of permissions) {
            await prisma.rolePermission.create({
                data: {
                    roleId: role.id,
                    permissionId: permission.id,
                },
            });
        }

        console.log(`✅ Seeded role: ${role.name} with ${permissions.length} permissions`);
    }

    console.log(`✅ Seeded ${BUILT_IN_ROLES.length} built-in roles`);
}

async function main() {
    try {
        await seedRoles();
        console.log('✅ Role seeding completed successfully');
    } catch (error) {
        console.error('❌ Error seeding roles:', error);
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

module.exports = { seedRoles };
