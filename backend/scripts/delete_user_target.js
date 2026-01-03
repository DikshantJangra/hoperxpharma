const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
    try {
        const email = 'dikshant.jangra2024@nst.rishihood.edu.in';
        console.log(`Searching for user with email: ${email}`);

        const user = await prisma.user.findFirst({
            where: {
                email: email
            }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log(`Found user: ${user.email} (ID: ${user.id})`);

        // Delete all related records first

        // Delete magic links
        const links = await prisma.magicLink.deleteMany({
            where: { email: user.email }
        });
        console.log(`Deleted ${links.count} magic links.`);

        // Delete access logs
        const accessLogs = await prisma.accessLog.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${accessLogs.count} access logs.`);

        // Delete onboarding data
        const onboarding = await prisma.onboardingProgress.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${onboarding.count} onboarding records.`);

        // Delete store user associations
        const storeUsers = await prisma.storeUser.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${storeUsers.count} store user records.`);

        // Delete the user
        await prisma.user.delete({
            where: { id: user.id }
        });

        console.log('User deleted successfully.');
    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
