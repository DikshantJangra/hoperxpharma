// Script to update a specific user to ADMIN role
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserToAdmin(email) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ User ${email} not found`);
            return;
        }

        if (user.role === 'ADMIN') {
            console.log(`✅ User ${email} is already an ADMIN`);
            return;
        }

        // Update user to ADMIN
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
        });

        console.log(`✅ Successfully updated ${email} to ADMIN role`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Previous role: ${user.role}`);
        console.log(`   New role: ADMIN`);
    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: node update-user-admin.js <email>');
    process.exit(1);
}

updateUserToAdmin(email);
