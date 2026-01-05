// Quick test: Emit event and check if alert is created
const database = require('./src/config/database');
const eventBus = require('./src/events/eventBus');
const alertEventListener = require('./src/events/alertEventListener');
const { INVENTORY_EVENTS } = require('./src/events/eventTypes');

const prisma = database.getClient();

async function testAutoCreation() {
    try {
        console.log('\n🧪 Testing Automatic Alert Creation...\n');

        // Initialize the event listener (simulating server startup)
        console.log('1️⃣ Initializing alert event listener...');
        alertEventListener.initialize();

        // Wait a moment for listeners to register
        await new Promise(resolve => setTimeout(resolve, 500));

        const storeId = 'cmj05wyqo0001149rer0lp7mr';

        // Count alerts before
        const beforeCount = await prisma.alert.count({ where: { storeId } });
        console.log(`   Alerts before: ${beforeCount}\n`);

        // Emit an event
        console.log('2️⃣ Emitting LOW_STOCK event...');
        eventBus.emitEvent(INVENTORY_EVENTS.LOW_STOCK, {
            storeId,
            entityType: 'drug',
            entityId: 'auto-test-drug',
            drugName: 'Auto-Created Test Drug',
            currentStock: 1,
            reorderLevel: 10,
            deficit: 9,
        });

        // Wait for async processing
        console.log('3️⃣ Waiting for alert to be created...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Count alerts after
        const afterCount = await prisma.alert.count({ where: { storeId } });
        console.log(`   Alerts after: ${afterCount}\n`);

        if (afterCount > beforeCount) {
            console.log('✅ SUCCESS! Alert was auto-created!');

            const newAlert = await prisma.alert.findFirst({
                where: { storeId },
                orderBy: { createdAt: 'desc' },
            });
            console.log(`   Title: ${newAlert.title}`);
            console.log(`   Priority: ${newAlert.priority}`);
        } else {
            console.log('❌ FAILED! No alert was created.');
            console.log('   Event was emitted but listener did not create alert.');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testAutoCreation();
