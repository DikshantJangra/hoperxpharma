const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
    const email = 'dikshant.jangra2024@nst.rishihood.edu.in';
    try {
        console.log(`🔍 Finding user with email: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('❌ User not found.');
            return;
        }

        console.log(`✅ User found: ${user.id} (${user.firstName} ${user.lastName})`);

        // Delete user (Cascades should handle relations)
        console.log('🗑️  Deleting related logs...');
        await prisma.accessLog.deleteMany({ where: { userId: user.id } });
        await prisma.auditLog.deleteMany({ where: { userId: user.id } });

        console.log('🗑️  Deleting user and cascading relations...');
        await prisma.user.delete({
            where: { id: user.id }
        });

        console.log('✅ User deleted successfully.');

    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
