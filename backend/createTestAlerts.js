const database = require('./src/config/database');
const eventBus = require('./src/events/eventBus');
const { INVENTORY_EVENTS, AUTH_EVENTS } = require('./src/events/eventTypes');

const prisma = database.getClient();

/**
 * Test script to create sample alerts FOR ANY ACTIVE USER
 * Run with: node createTestAlerts.js
 */

async function createTestAlerts() {
    try {
        console.log('🚀 Creating test alerts...\n');

        // Find ANY active user with a store
        const user = await prisma.user.findFirst({
            where: {
                isActive: true,
                storeUsers: {
                    some: {},
                },
            },
            include: {
                storeUsers: {
                    include: {
                        store: true,
                    },
                },
            },
        });

        if (!user) {
            console.error('❌ No active users found in database');
            return;
        }

        const storeId = user.storeUsers[0]?.storeId;
        if (!storeId) {
            console.error('❌ No store found for user');
            return;
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`✅ Store: ${user.storeUsers[0].store.name}`);
        console.log(`✅ Store ID: ${storeId}\n`);

        console.log('Creating 5 test alerts...\n');

        // Test 1: EXPIRED batch (CRITICAL 🔴)
        console.log('1️⃣  🔴 CRITICAL - Expired batch');
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
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Expiring in 3 days (CRITICAL 🔴)
        console.log('2️⃣  🔴 CRITICAL - Batch expiring in 3 days');
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

        // Test 3: Expiring in 7 days (HIGH 🟠)
        console.log('3️⃣  🟠 HIGH - Batch expiring in 7 days');
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

        // Test 4: LOW STOCK (HIGH 🟠)
        console.log('4️⃣  🟠 HIGH - Low stock alert');
        eventBus.emitEvent(INVENTORY_EVENTS.LOW_STOCK, {
            storeId,
            entityType: 'drug',
            entityId: 'test-drug-004',
            drugName: 'Crocin Advance',
            currentStock: 3,
            reorderLevel: 10,
            deficit: 7,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 5: NEW LOGIN (HIGH 🟠)
        console.log('5️⃣  🟠 HIGH - New device login\n');
        eventBus.emitEvent(AUTH_EVENTS.NEW_DEVICE_LOGIN, {
            userId: user.id,
            storeId,
            email: user.email,
            deviceInfo: 'Chrome 131 on MacOS',
            ipAddress: '192.168.1.100',
            location: {
                cityName: 'Mumbai',
                countryName: 'India',
            },
            timestamp: new Date(),
        });
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check results
        console.log('📊 Checking database...\n');
        const alerts = await prisma.alert.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        console.log(`✅ Total alerts: ${alerts.length}\n`);

        const grouped = alerts.reduce((acc, a) => {
            acc[a.priority] = (acc[a.priority] || 0) + 1;
            return acc;
        }, {});

        console.log('By priority:');
        Object.entries(grouped).forEach(([p, c]) => {
            const i = p === 'CRITICAL' ? '🔴' : p === 'HIGH' ? '🟠' : p === 'MED IUM' ? '🟡' : '🔵';
            console.log(`  ${i} ${p}: ${c}`);
        });

        console.log('\nRecent alerts:');
        alerts.slice(0, 8).forEach((a, i) => {
            const icon = a.priority === 'CRITICAL' ? '🔴' : a.priority === 'HIGH' ? '🟠' : '🟡';
            const status = a.seenAt ? ' (seen)' : ' 🆕';
            console.log(`  ${i + 1}. ${icon} ${a.title}${status}`);
        });

        console.log('\n✅ Success! Alerts created in database.');
        console.log('\n📱 To see in UI:');
        console.log('   1. Login to http://localhost:3000 with this account:');
        console.log(`      Email: ${user.email}`);
        console.log('   2. Look for NotificationBell in top nav (🔔 with badge)');
        console.log('   3. Click to view alerts');
        console.log('\n⚠️  If bell not visible: Frontend components need integration');
        console.log('   Let me know and I can add them for you!');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

createTestAlerts();
