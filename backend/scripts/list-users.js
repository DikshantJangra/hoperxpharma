// Script to list all users and their roles
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listAllUsers() {
    try {
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                storeUsers: {
                    include: {
                        store: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        console.log(`\n📋 Total users: ${users.length}\n`);

        users.forEach((user, index) => {
            const stores = user.storeUsers.map(su => su.store.name).join(', ') || 'No stores';
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Stores: ${stores}`);
            console.log(`   Created: ${user.createdAt.toISOString()}`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listAllUsers();
