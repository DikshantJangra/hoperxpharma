const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const patients = await prisma.patient.findMany({
            where: {
                OR: [
                    { name: { contains: 'test', mode: 'insensitive' } },
                    { email: { contains: 'test', mode: 'insensitive' } },
                ],
            },
            take: 5,
        });
        console.log('Patients found:', patients.length);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

test().finally(() => prisma.$disconnect());
