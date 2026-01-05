const database = require('./src/config/database');
const prisma = database.getClient();

async function checkAlerts() {
    try {
        console.log('\n🔍 Checking alerts in database...\n');

        // Get recent alerts
        const alerts = await prisma.alert.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                storeId: true,
                title: true,
                priority: true,
                status: true,
                seenAt: true,
                createdAt: true,
            },
        });

        console.log(`Found ${alerts.length} alerts:\n`);

        alerts.forEach((a, i) => {
            console.log(`${i + 1}. [${a.priority}] ${a.title}`);
            console.log(`   Store: ${a.storeId}`);
            console.log(`   Status: ${a.status} | Seen: ${a.seenAt ? 'Yes' : 'No'}`);
            console.log(`   Created: ${a.createdAt.toISOString()}\n`);
        });

        // Get all users with their stores
        const users = await prisma.user.findMany({
            where: { isActive: true },
            include: {
                storeUsers: {
                    select: {
                        storeId: true,
                        isPrimary: true,
                    },
                },
            },
            take: 5,
        });

        console.log(`\n📋 Active users and their stores:\n`);
        users.forEach((u, i) => {
            console.log(`${i + 1}. ${u.email}`);
            u.storeUsers.forEach(su => {
                console.log(`   └─ Store: ${su.storeId} ${su.isPrimary ? '(PRIMARY)' : ''}`);
            });
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkAlerts();
