// Script to check user permissions
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const permissionService = require('../src/services/permissionService');

const prisma = new PrismaClient();

async function checkUserPermissions(email) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            console.log(`❌ User ${email} not found`);
            return;
        }

        console.log(`\n👤 User: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role (enum): ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`\n📋 Assigned Roles (RBAC):`);

        if (user.userRoles.length === 0) {
            console.log('   No RBAC roles assigned');
        } else {
            user.userRoles.forEach(ur => {
                console.log(`   - ${ur.role.name} (${ur.storeId ? 'Store-specific' : 'Global'})`);
            });
        }

        console.log(`\n🔐 Fetching permissions via permissionService...`);
        const permissions = await permissionService.getUserPermissions(user.id);

        console.log(`\n✅ Total Permissions: ${permissions.length}`);

        if (permissions.length > 0) {
            console.log(`\n📝 Sample Permissions (first 20):`);
            permissions.slice(0, 20).forEach(p => {
                console.log(`   - ${p}`);
            });

            if (permissions.length > 20) {
                console.log(`   ... and ${permissions.length - 20} more`);
            }
        } else {
            console.log(`\n⚠️  No permissions found!`);
        }

        // Check if user.role is ADMIN
        if (user.role === 'ADMIN') {
            console.log(`\n✅ User has ADMIN role - should have ALL permissions automatically`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node check-permissions.js <email>');
    process.exit(1);
}

checkUserPermissions(email);
