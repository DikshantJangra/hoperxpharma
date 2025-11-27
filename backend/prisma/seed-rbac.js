const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRBAC() {
    console.log('🌱 Seeding RBAC data...');

    // Create basic roles
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full system access with all permissions',
            builtIn: true,
            category: 'system',
        },
    });

    const pharmacistRole = await prisma.role.upsert({
        where: { name: 'Pharmacist' },
        update: {},
        create: {
            name: 'Pharmacist',
            description: 'Pharmacist with clinical permissions',
            builtIn: true,
            category: 'clinical',
        },
    });

    const cashierRole = await prisma.role.upsert({
        where: { name: 'Cashier' },
        update: {},
        create: {
            name: 'Cashier',
            description: 'Point of sale and basic inventory access',
            builtIn: true,
            category: 'operational',
        },
    });

    console.log('✅ Created roles:', { adminRole: adminRole.id, pharmacistRole: pharmacistRole.id, cashierRole: cashierRole.id });

    // Create basic permissions
    const permissions = [
        { code: 'patient.create', name: 'Create Patient', category: 'patient', resource: 'patient' },
        { code: 'patient.read', name: 'View Patient', category: 'patient', resource: 'patient' },
        { code: 'patient.update', name: 'Update Patient', category: 'patient', resource: 'patient' },
        { code: 'patient.delete', name: 'Delete Patient', category: 'patient', resource: 'patient' },
        { code: 'prescription.create', name: 'Create Prescription', category: 'prescription', resource: 'prescription' },
        { code: 'prescription.read', name: 'View Prescription', category: 'prescription', resource: 'prescription' },
        { code: 'sale.create', name: 'Create Sale', category: 'sale', resource: 'sale' },
        { code: 'sale.read', name: 'View Sale', category: 'sale', resource: 'sale' },
        { code: 'inventory.read', name: 'View Inventory', category: 'inventory', resource: 'inventory' },
        { code: 'inventory.update', name: 'Update Inventory', category: 'inventory', resource: 'inventory' },
    ];

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm,
        });
    }

    console.log(`✅ Created ${permissions.length} permissions`);
    console.log('🎉 RBAC seeding complete!');
}

seedRBAC()
    .catch((e) => {
        console.error('❌ Error seeding RBAC:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
