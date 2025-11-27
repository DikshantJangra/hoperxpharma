const { PrismaClient } = require('@prisma/client');
const { USER_ROLES } = require('../src/constants/roles');

const prisma = new PrismaClient();

/**
 * Migration script to move users from User.role enum to UserRoleAssignment table
 * This preserves existing role assignments and store associations
 */
async function migrateUsersToRBAC() {
    console.log('🔄 Starting user migration to RBAC system...\n');

    try {
        // Step 1: Get all users with their current roles and store associations
        const users = await prisma.user.findMany({
            include: {
                storeUsers: {
                    include: {
                        store: true,
                    },
                },
            },
        });

        console.log(`📊 Found ${users.length} users to migrate\n`);

        // Step 2: Get all roles from the new Role table
        const roles = await prisma.role.findMany();
        const roleMap = new Map(roles.map(r => [r.name, r]));

        console.log(`📋 Available roles: ${roles.map(r => r.name).join(', ')}\n`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        // Step 3: Migrate each user
        for (const user of users) {
            try {
                const userRoleName = user.role; // Current enum value (ADMIN, PHARMACIST, etc.)
                const role = roleMap.get(userRoleName);

                if (!role) {
                    console.warn(`⚠️  No matching role found for user ${user.email} (role: ${userRoleName})`);
                    skippedCount++;
                    continue;
                }

                // Check if user already has role assignments
                const existingAssignments = await prisma.userRoleAssignment.findMany({
                    where: { userId: user.id },
                });

                if (existingAssignments.length > 0) {
                    console.log(`⏭️  User ${user.email} already has role assignments, skipping...`);
                    skippedCount++;
                    continue;
                }

                // Step 4: Create role assignments based on store associations
                if (user.storeUsers.length > 0) {
                    // User has store associations - create store-scoped roles
                    for (const storeUser of user.storeUsers) {
                        await prisma.userRoleAssignment.create({
                            data: {
                                userId: user.id,
                                roleId: role.id,
                                storeId: storeUser.storeId,
                                assignedBy: null, // System migration
                            },
                        });
                        console.log(`✅ Assigned ${role.name} to ${user.email} for store ${storeUser.store.name}`);
                    }
                } else {
                    // User has no store associations - create global role
                    await prisma.userRoleAssignment.create({
                        data: {
                            userId: user.id,
                            roleId: role.id,
                            storeId: null, // Global role
                            assignedBy: null, // System migration
                        },
                    });
                    console.log(`✅ Assigned global ${role.name} to ${user.email}`);
                }

                migratedCount++;
            } catch (error) {
                console.error(`❌ Error migrating user ${user.email}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${migratedCount} users`);
        console.log(`   ⏭️  Skipped: ${skippedCount} users`);
        console.log(`   ❌ Errors: ${errorCount} users`);

        // Step 5: Verification
        console.log('\n🔍 Verifying migration...');
        const totalAssignments = await prisma.userRoleAssignment.count();
        console.log(`   Total role assignments created: ${totalAssignments}`);

        // Check for users without assignments
        const usersWithoutRoles = await prisma.user.findMany({
            where: {
                userRoles: {
                    none: {},
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        if (usersWithoutRoles.length > 0) {
            console.log(`\n⚠️  Warning: ${usersWithoutRoles.length} users still have no role assignments:`);
            usersWithoutRoles.forEach(u => {
                console.log(`   - ${u.email} (enum role: ${u.role})`);
            });
        } else {
            console.log('\n✅ All users have role assignments!');
        }

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
if (require.main === module) {
    migrateUsersToRBAC()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { migrateUsersToRBAC };
