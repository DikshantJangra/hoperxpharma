const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnection(retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to connect...`);
            const count = await prisma.drug.count();
            console.log(`Success! Drug count: ${count}`);
            return;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    console.error('All connection attempts failed.');
    process.exit(1);
}

checkConnection()
    .finally(() => prisma.$disconnect());
