/**
 * Script: Make dikshantjangra1@gmail.com a PAID Subscriber
 * 
 * Settings:
 * - Status: ACTIVE (paid user)
 * - Active Verticals: ['retail'] (Retail Pharmacy)
 * - Billing Cycle: yearly
 * - Period: 1 year from today
 * - Monthly Amount: ₹799
 * - Auto Renew: true
 * 
 * Run with: node make_paid_subscriber.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const USER_EMAIL = 'dikshantjangra1@gmail.com';

async function main() {
    console.log('🔍 Finding user:', USER_EMAIL);

    // Find the user
    const user = await prisma.user.findUnique({
        where: { email: USER_EMAIL },
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
        console.error('❌ User not found:', USER_EMAIL);
        process.exit(1);
    }

    console.log('✅ Found user:', user.firstName, user.lastName);

    // Get primary store
    const primaryStoreUser = user.storeUsers.find(su => su.isPrimary) || user.storeUsers[0];

    if (!primaryStoreUser) {
        console.error('❌ User has no associated stores');
        process.exit(1);
    }

    const store = primaryStoreUser.store;
    console.log('📦 Primary store:', store.name);

    // Calculate dates
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const subscriptionData = {
        status: 'ACTIVE',
        activeVerticals: ['retail'],
        comboBundle: null,
        monthlyAmount: 799.00,
        billingCycle: 'yearly',
        currentPeriodStart: now,
        currentPeriodEnd: oneYearFromNow,
        trialEndsAt: oneYearFromNow, // Trial ends when subscription ends
        autoRenew: true,
    };

    console.log('\n📝 Subscription settings:');
    console.log('   Status: ACTIVE');
    console.log('   Active Verticals: [retail]');
    console.log('   Billing Cycle: yearly');
    console.log('   Monthly Amount: ₹799');
    console.log('   Period Start:', now.toISOString().split('T')[0]);
    console.log('   Period End:', oneYearFromNow.toISOString().split('T')[0]);
    console.log('   Auto Renew: true');

    if (store.subscription) {
        // Update existing subscription
        console.log('\n🔄 Updating existing subscription...');

        const updated = await prisma.subscription.update({
            where: { id: store.subscription.id },
            data: subscriptionData
        });

        console.log('✅ Subscription updated!');
        console.log('   Subscription ID:', updated.id);
    } else {
        // Create new subscription
        console.log('\n➕ Creating new subscription...');

        const created = await prisma.subscription.create({
            data: {
                storeId: store.id,
                ...subscriptionData
            }
        });

        console.log('✅ Subscription created!');
        console.log('   Subscription ID:', created.id);
    }

    console.log('\n🎉 Done! User is now a PAID subscriber with Retail access.');
}

main()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
