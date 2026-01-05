const database = require('./src/config/database');
const alertService = require('./src/services/alertService');

const prisma = database.getClient();

/**
 * SIMPLE: Create alerts directly from current inventory
 */

async function createInventoryAlerts() {
    try {
        console.log('🔍 Scanning inventory...\n');

        const user = await prisma.user.findFirst({
            where: { isActive: true, storeUsers: { some: {} } },
            include: { storeUsers: { include: { store: true } } },
        });

        if (!user) throw new Error('No users found');

        const storeId = user.storeUsers[0]?.storeId;
        console.log(`✅ Store: ${user.storeUsers[0].store.name}\n`);

        let created = 0;

        // Get inventory batches
        const batches = await prisma.inventoryBatch.findMany({
            where: { storeId, quantityInStock: { gt: 0 } },
            include: { drug: true },
            take: 100,
        });

        console.log(`Found ${batches.length} batches with stock\n`);

        const now = new Date();
        for (const batch of batches) {
            const daysLeft = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));

            // Create alerts for expired/expiring
            if (daysLeft <= 30) {
                const isExpired = daysLeft <= 0;
                const priority = isExpired ? 'CRITICAL' : daysLeft <= 7 ? 'HIGH' : 'MEDIUM';

                await alertService.createAlert(storeId, {
                    category: 'INVENTORY',
                    priority,
                    title: isExpired ? 'Expired batch detected' : `Batch expiring in ${daysLeft} days`,
                    description: isExpired
                        ? `Batch ${batch.batchNumber} of ${batch.drug.name} expired. Remove from stock.`
                        : `Batch ${batch.batchNumber} of ${batch.drug.name} expires soon (${daysLeft} days left).`,
                    source: 'Direct Scan',
                    actionUrl: `/inventory/batches/${batch.id}`,
                    actionLabel: 'View Batch',
                    channels: ['IN_APP'],
                });

                created++;
                const icon = priority === 'CRITICAL' ? '🔴' : priority === 'HIGH' ? '🟠' : '🟡';
                console.log(`${icon} ${batch.drug.name} - ${isExpired ? 'EXPIRED' : `${daysLeft}d left`}`);
            }

            // Low stock check
            if (batch.quantityInStock < 10) {
                await alertService.createAlert(storeId, {
                    category: 'INVENTORY',
                    priority: batch.quantityInStock < 5 ? 'HIGH' : 'MEDIUM',
                    title: 'Stock running low',
                    description: `${batch.drug.name} has only ${batch.quantityInStock} units remaining.`,
                    source: 'Direct Scan',
                    actionUrl: `/inventory/batches/${batch.id}`,
                    actionLabel: 'Restock',
                    channels: ['IN_APP'],
                });

                created++;
                console.log(`📦 LOW: ${batch.drug.name} - ${batch.quantityInStock} units`);
            }
        }

        console.log(`\n✅ Created ${created} alerts\n`);

        // Show results
        const alerts = await prisma.alert.findMany({
            where: { storeId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        console.log(`📊 Total alerts in database: ${alerts.length}`);
        console.log(`   Unread: ${alerts.filter(a => !a.seenAt).length}`);

        console.log('\nRecent 10:');
        alerts.slice(0, 10).forEach((a, i) => {
            const icon = a.priority === 'CRITICAL' ? '🔴' : a.priority === 'HIGH' ? '🟠' : '🟡';
            console.log(`  ${i + 1}. ${icon} ${a.title}`);
        });

        console.log('\n🎉 Done! Refresh your app to see alerts.');
        process.exit(0);
    } catch (error) {
        console.error('❌', error.message);
        process.exit(1);
    }
}

createInventoryAlerts();
