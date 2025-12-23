const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const accounts = await prisma.emailAccount.findMany({
        select: { id: true, email: true, isActive: true, isVerified: true }
    });
    console.log('Accounts:', JSON.stringify(accounts, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
