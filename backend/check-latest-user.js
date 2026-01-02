const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestUser() {
    try {
        console.log('🔍 Checking database for latest user...');
        const user = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { storeUsers: true }
        });

        if (user) {
            console.log('\n✅ User Found in DB!');
            console.log('--------------------------------');
            console.log(`ID:        ${user.id}`);
            console.log(`Email:     ${user.email}`);
            console.log(`Name:      ${user.firstName} ${user.lastName}`);
            console.log(`Created:   ${user.createdAt}`);
            console.log(`Provider:  ${user.password ? 'Password' : 'Google OAuth'} (Password is null)`);
            console.log('--------------------------------');
        } else {
            console.log('❌ No users found in database.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestUser();
