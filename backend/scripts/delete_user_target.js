const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
    try {
        const email = 'dikshant.jangra2024@gmail.com';
        console.log(`Searching for user with email: ${email}`);

        const user = await prisma.user.findFirst({
            where: {
                email: {
                    startsWith: 'dikshant.jangra2024'
                }
            }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log(`Found user: ${user.email} (ID: ${user.id})`);

        // Delete magic links first (foreign key constraint likely, though cascade might handle it)
        try {
            const links = await prisma.magicLink.deleteMany({
                where: { userId: user.id } // Assuming relation exists, or email
            });
            console.log(`Deleted ${links.count} magic links.`);
        } catch (e) {
            // MagicLink might link by email or userId, trying email if above failed or just generic catch
            const linksByEmail = await prisma.magicLink.deleteMany({
                where: { email: user.email }
            });
            console.log(`Deleted ${linksByEmail.count} magic links by email.`);
        }

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
