// Test login alert creation
const database = require('./src/config/database');
const eventBus = require('./src/events/eventBus');
const alertEventListener = require('./src/events/alertEventListener');
const { AUTH_EVENTS } = require('./src/events/eventTypes');

const prisma = database.getClient();

async function testLoginAlert() {
    try {
        console.log('\n🧪 Testing Login Alert Creation...\n');

        // Initialize the event listener
        console.log('1️⃣ Initializing alert event listener...');
        alertEventListener.initialize();

        await new Promise(resolve => setTimeout(resolve, 500));

        const storeId = 'cmj05wyqo0001149rer0lp7mr';

        // Count alerts before
        const beforeCount = await prisma.alert.count({ where: { storeId } });
        console.log(`   Alerts before: ${beforeCount}\n`);

        // Emit login event
        console.log('2️⃣ Emitting NEW_DEVICE_LOGIN event...');
        eventBus.emitEvent(AUTH_EVENTS.NEW_DEVICE_LOGIN, {
            storeId,
            entityType: 'user',
            entityId: 'test-user-id',
            email: 'test@example.com',
            userName: 'Test User',
            deviceInfo: 'Mozilla/5.0 Test Browser',
            ipAddress: '127.0.0.1',
            timestamp: new Date(),
        });

        // Wait for async processing
        console.log('3️⃣ Waiting for alert to be created...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Count alerts after
        const afterCount = await prisma.alert.count({ where: { storeId } });
        console.log(`   Alerts after: ${afterCount}\n`);

        if (afterCount > beforeCount) {
            console.log('✅ SUCCESS! Login alert was created!');

            const newAlert = await prisma.alert.findFirst({
                where: { storeId, category: 'SECURITY' },
                orderBy: { createdAt: 'desc' },
            });
            console.log(`   Title: ${newAlert?.title}`);
            console.log(`   Category: ${newAlert?.category}`);
            console.log(`   Priority: ${newAlert?.priority}`);
        } else {
            console.log('❌ FAILED! No login alert was created.');
            console.log('   Check if the rule is enabled in alertRules.js');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testLoginAlert();
