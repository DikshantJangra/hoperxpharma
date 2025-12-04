// Script to update the first user to ADMIN role
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateFirstUserToAdmin() {
    try {
        // Get all users ordered by creation date
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
        });

        if (users.length === 0) {
            console.log('❌ No users found in the database');
            return;
        }

        const firstUser = users[0];

        if (firstUser.role === 'ADMIN') {
            console.log(`✅ User ${firstUser.email} is already an ADMIN`);
            return;
        }

        // Update the first user to ADMIN
        await prisma.user.update({
            where: { id: firstUser.id },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ Successfully updated ${firstUser.email} to ADMIN role`);
        console.log(`   User ID: ${firstUser.id}`);
        console.log(`   Previous role: ${firstUser.role}`);
        console.log(`   New role: ADMIN`);
    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateFirstUserToAdmin();
