/**
 * Cleanup Script - Remove all subscription and payment data for test account
 * Usage: node cleanup_test_subscription.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_EMAIL = 'hoperxpharma@gmail.com';

async function cleanupTestSubscription() {
    console.log(`\n🧹 Starting cleanup for ${TEST_EMAIL}...\n`);

    try {
        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL },
            include: {
                storeUsers: {
                    include: {
                        store: {
                            include: {
                                subscription: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log(`❌ User ${TEST_EMAIL} not found`);
            return;
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.id})`);

        // 2. Get all stores for this user
        const storeIds = user.storeUsers.map(su => su.storeId);
        console.log(`📦 Found ${storeIds.length} store(s)`);

        for (const storeUser of user.storeUsers) {
            const store = storeUser.store;
            console.log(`\n  Store: ${store.name} (${store.id})`);

            // 3. Get all payment IDs for this store
            const storePayments = await prisma.payment.findMany({
                where: { storeId: store.id },
                select: { id: true }
            });
            const paymentIds = storePayments.map(p => p.id);

            // 4. Delete payment events
            const paymentEvents = await prisma.paymentEvent.deleteMany({
                where: { paymentId: { in: paymentIds } }
            });
            console.log(`    ✓ Deleted ${paymentEvents.count} payment events`);

            // 5. Delete payment reconciliations
            const reconciliations = await prisma.paymentReconciliation.deleteMany({
                where: { paymentId: { in: paymentIds } }
            });
            console.log(`    ✓ Deleted ${reconciliations.count} payment reconciliations`);

            // 6. Delete payments
            const payments = await prisma.payment.deleteMany({
                where: { storeId: store.id }
            });
            console.log(`    ✓ Deleted ${payments.count} payments`);

            // 7. Delete usage quota
            if (store.subscription) {
                const usageQuota = await prisma.usageQuota.deleteMany({
                    where: { subscriptionId: store.subscription.id }
                });
                console.log(`    ✓ Deleted ${usageQuota.count} usage quota records`);
            }

            // 8. Reset subscription to trial
            if (store.subscription) {
                const trialEnd = new Date();
                trialEnd.setDate(trialEnd.getDate() + 14); // 14 days trial

                await prisma.subscription.update({
                    where: { id: store.subscription.id },
                    data: {
                        status: 'TRIAL',
                        activeVerticals: ['retail'],
                        comboBundle: null,
                        monthlyAmount: null,
                        billingCycle: 'monthly',
                        trialEndsAt: trialEnd,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: trialEnd,
                        autoRenew: false,
                        planId: null
                    }
                });
                console.log(`    ✓ Reset subscription to TRIAL (expires: ${trialEnd.toLocaleDateString()})`);
            }
        }

        // 9. Delete webhook events related to this user's payments
        const webhookEvents = await prisma.webhookEvent.deleteMany({
            where: {
                rawPayload: {
                    path: ['payload', 'payment', 'entity', 'notes', 'user_id'],
                    equals: user.id
                }
            }
        });
        console.log(`\n✓ Deleted ${webhookEvents.count} webhook events`);

        console.log(`\n✅ Cleanup completed successfully for ${TEST_EMAIL}!`);
        console.log(`\n📊 Summary:`);
        console.log(`   - Stores processed: ${storeIds.length}`);
        console.log(`   - All payments deleted`);
        console.log(`   - All payment events deleted`);
        console.log(`   - All reconciliations deleted`);
        console.log(`   - Subscription reset to TRIAL`);
        console.log(`   - Webhook events cleaned up`);

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run cleanup
cleanupTestSubscription()
    .then(() => {
        console.log('\n✨ Done!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
