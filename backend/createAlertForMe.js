const database = require('./src/config/database');
const alertService = require('./src/services/alertService');

const prisma = database.getClient();

async function createAlertForUser(email) {
    try {
        console.log(`\n🎯 Creating alert for ${email}...\n`);

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                storeUsers: {
                    include: { store: true },
                },
            },
        });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            return;
        }

        const storeId = user.storeUsers[0]?.storeId;
        if (!storeId) {
            console.error('❌ No store found for user');
            return;
        }

        console.log(`✅ User: ${user.firstName} ${user.lastName}`);
        console.log(`✅ Store: ${user.storeUsers[0].store.name}`);
        console.log(`✅ Store ID: ${storeId}\n`);

        // Create a test alert
        const alert = await alertService.createAlert(storeId, {
            category: 'INVENTORY',
            priority: 'CRITICAL',
            title: '🔴 TEST: Out of Stock Alert',
            description: 'This is a test alert to verify the notification system is working correctly. If you see this, the alert system is functional!',
            source: 'Manual Test',
            actionUrl: '/inventory',
            actionLabel: 'View Inventory',
            channels: ['IN_APP'],
        });

        console.log(`✅ Alert created successfully!`);
        console.log(`   ID: ${alert.id}`);
        console.log(`   Title: ${alert.title}`);
        console.log(`   Priority: ${alert.priority}\n`);

        // Verify it was created
        const allAlerts = await prisma.alert.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });

        console.log(`📊 Recent alerts for this store: ${allAlerts.length}\n`);
        allAlerts.forEach((a, i) => {
            console.log(`  ${i + 1}. [${a.priority}] ${a.title}`);
        });

        console.log('\n🎉 Done! Now refresh your app to see the alert.');
        console.log(`   Login as: ${email}`);
        console.log(`   Look for the 🔔 bell icon with a red badge!\n`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Create alert for dikshantjangra1@gmail.com
createAlertForUser('dikshantjangra1@gmail.com');
