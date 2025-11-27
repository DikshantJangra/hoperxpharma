const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'Hopeuser1@gmail.com';

    console.log(`Updating user ${email} to ADMIN...`);

    const user = await prisma.user.update({
        where: { email },
        data: {
            role: 'ADMIN'
        }
    });

    console.log('User updated:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
