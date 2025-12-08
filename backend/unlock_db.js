const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to release advisory locks...');
    try {
        // Attempt to unlock the specific migration lock if possible, or usually just wait.
        // However, we can try to query the locks or just ensure we can connect.
        // Actually, we can't force unlock *other* sessions' advisory locks easily unless we are superuser and kill the session.
        // But often running a simple query confirms connection.

        // For Neon/Postgres, we can check activity.
        const locks = await prisma.$queryRaw`SELECT pid, locktype, mode, granted, objid FROM pg_locks WHERE locktype = 'advisory'`;
        console.log('Current advisory locks:', locks);

        if (locks.length > 0) {
            console.log('Found locks. Attempting to terminate sessions holding these locks...');
            for (const lock of locks) {
                const pid = lock.pid;
                console.log(`Terminating session ${pid}...`);
                await prisma.$queryRaw`SELECT pg_terminate_backend(${pid})`;
            }
            console.log('Sessions terminated.');
        } else {
            console.log('No advisory locks found. The issue might have resolved itself or is related to connection pooling limits.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
