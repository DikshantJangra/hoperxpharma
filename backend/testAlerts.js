const database = require('./src/config/database');
const eventBus = require('./src/events/eventBus');
const { INVENTORY_EVENTS, AUTH_EVENTS } = require('./src/events/eventTypes');

const prisma = database.getClient();

/**
 * Test script to create sample alerts for testing
 * Run with: node testAlerts.js
 */

async function createTestAlerts() {
    try {
        console.log('🚀 Creating test alerts...\n');

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: 'dik shantjangra1@gmail.com' },
            include: {
                storeUsers: {
                    include: {
                        store: true,
                    },
                },
            },
        });

        if (!user) {
            console.error('❌ User not found with email: dikshantjangra1@gmail.com');
            return;
        }

        const storeId = user.storeUsers[0]?.storeId;
        if (!storeId) {
            console.error('❌ No store found for user');
            return;
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`✅ Store ID: ${storeId}\n`);

        // Test 1: Create an EXPIRED batch alert (CRITICAL)
        console.log('1️⃣  Creating CRITICAL expired batch alert...');
        eventBus.emitEvent(INVENTORY_EVENTS.EXPIRED, {
            storeId,
            entityType: 'batch',
            entityId: 'test-batch-expired-001',
            drugId: 'test-drug-001',
            drugName: 'Paracetamol 650mg',
            batchNumber: 'B00123',
            expiryDate: new Date('2025-12-31'),
            quantityInStock: 50,
            mrp: 120,
        });

        // Wait for event to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Create a batch expiring in 3 days (CRITICAL)
        console.log('2️⃣  Creating CRITICAL batch expiring in 3 days...');
        const in3Days = new Date();
        in3Days.setDate(in3Days.getDate() + 3);

        eventBus.emitEvent(INVENTORY_EVENTS.EXPIRY_NEAR, {
            storeId,
            entityType: 'batch',
            entityId: 'test-batch-near-001',
            drugId: 'test-drug-002',
            drugName: 'Amoxicillin 500mg',
            batchNumber: 'B00456',
            expiryDate: in3Days,
            daysLeft: 3,
            quantityInStock: 100,
            mrp: 250,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 3: Create a batch expiring in 7 days (HIGH)
        console.log('3️⃣  Creating HIGH priority batch expiring in 7 days...');
        const in7Days = new Date();
        in7Days.setDate(in7Days.getDate() + 7);

        eventBus.emitEvent(INVENTORY_EVENTS.EXPIRY_NEAR, {
            storeId,
            entityType: 'batch',
            entityId: 'test-batch-near-002',
            drugId: 'test-drug-003',
            drugName: 'Azithromycin 250mg',
            batchNumber: 'B00789',
            expiryDate: in7Days,
            daysLeft: 7,
            quantityInStock: 75,
            mrp: 185,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 4: Create LOW STOCK alert (HIGH priority - 50%+ deficit)
        console.log('4️⃣  Creating HIGH priority low stock alert...');
        eventBus.emitEvent(INVENTORY_EVENTS.LOW_STOCK, {
            storeId,
            entityType: 'drug',
            entityId: 'test-drug-004',
            drugName: 'Crocin Advance',
            currentStock: 3,
            reorderLevel: 10,
            deficit: 7, // 70% deficit = HIGH priority
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 5: Create NEW DEVICE LOGIN alert (HIGH)
        console.log('5️⃣  Creating HIGH priority new device login alert...');
        eventBus.emitEvent(AUTH_EVENTS.NEW_DEVICE_LOGIN, {
            userId: user.id,
            storeId,
            email: user.email,
            deviceInfo: 'Chrome on MacOS',
            ipAddress: '192.168.1.100',
            location: {
                cityName: 'Mumbai',
                countryName: 'India',
            },
            timestamp: new Date(),
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check created alerts
        console.log('\n📊 Checking created alerts...');
        const alerts = await prisma.alert.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        console.log(`\n✅ Total alerts in database for your store: ${alerts.length}\n`);

        const groupedByPriority = alerts.reduce((acc, alert) => {
            acc[alert.priority] = (acc[alert.priority] || 0) + 1;
            return acc;
        }, {});

        console.log('Alerts by priority:');
        Object.entries(groupedByPriority).forEach(([priority, count]) => {
            const icon = priority === 'CRITICAL' ? '🔴' : priority === 'HIGH' ? '🟠' : priority === 'MEDIUM' ? '🟡' : '🔵';
            console.log(`  ${icon} ${priority}: ${count}`);
        });

        console.log('\nRecent alerts:');
        alerts.slice(0, 10).forEach((alert, i) => {
            const icon = alert.priority === 'CRITICAL' ? '🔴' : alert.priority === 'HIGH' ? '🟠' : alert.priority === 'MEDIUM' ? '🟡' : '🔵';
            const status = alert.seenAt ? '👁️ ' : '🆕';
            console.log(`  ${i + 1}. ${status} ${icon} ${alert.title} - ${alert.category}`);
        });

        console.log('\n🎉 Test alerts created successfully!');
        console.log('\n💡 Next steps:');
        console.log('   1. Open your frontend app at http://localhost:3000');
        console.log('   2. Look for the notification bell in the top navigation');
        console.log('   3. You should see a badge showing alert count');
        console.log('   4. Click the bell to view alerts in the notification panel');
        console.log('\n   ⚠️  If you don\'t see the bell yet:');
        console.log('   - The frontend components need to be integrated');
        console.log('   - I can help you add them to your layout');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test alerts:', error);
        process.exit(1);
    }
}

// Run the script
createTestAlerts();
