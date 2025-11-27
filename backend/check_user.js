const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'Hopeuser1@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User Role:', user.role);
    console.log('Assigned Roles:', user.userRoles.map(ur => ur.role.name));

    const allPermissions = new Set();
    user.userRoles.forEach(ur => {
        ur.role.permissions.forEach(p => {
            allPermissions.add(p.permission.code);
        });
    });

    console.log('Effective Permissions:', Array.from(allPermissions));
    console.log('Has system.user.manage:', allPermissions.has('system.user.manage'));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
