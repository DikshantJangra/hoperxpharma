
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetWelcome() {
    const subId = 'cmk5nt97m000214zauo0l4g84';
    try {
        const updated = await prisma.subscription.update({
            where: { id: subId },
            data: {
                welcomeShown: false
            }
        });
        console.log('Successfully reset welcomeShown for:', updated.id);
    } catch (e) {
        console.error('Error resetting welcome:', e);
    } finally {
        await prisma.$disconnect();
    }
}

resetWelcome();
