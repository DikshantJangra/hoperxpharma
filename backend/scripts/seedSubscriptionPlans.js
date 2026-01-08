/**
 * Subscription Plans Seed Data
 * Run this to populate SubscriptionPlan table with default plans
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscriptionPlans = [
    {
        name: 'retail_monthly',
        displayName: 'Retail Pharmacy - Monthly',
        description: 'Perfect for independent retail pharmacies. Full POS, inventory, and patient management.',
        price: 299,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,      // Unlimited
        prescriptionLimit: null, // Unlimited
        storageLimit: 5120,      // 5GB
        multiStore: false
    },
    {
        name: 'retail_yearly',
        displayName: 'Retail Pharmacy - Yearly',
        description: 'Annual plan for retail pharmacies. Save 17% with yearly billing.',
        price: 2999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 5120,
        multiStore: false
    },
    {
        name: 'wholesale_monthly',
        displayName: 'Wholesale Pharmacy - Monthly',
        description: 'Designed for wholesale operations with bulk ordering and distributor management.',
        price: 499,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,  // 10GB
        multiStore: false
    },
    {
        name: 'wholesale_yearly',
        displayName: 'Wholesale Pharmacy - Yearly',
        description: 'Annual plan for wholesale pharmacies. Save 17% with yearly billing.',
        price: 4999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,
        multiStore: false
    },
    {
        name: 'hospital_monthly',
        displayName: 'Hospital Pharmacy - Monthly',
        description: 'Enterprise solution for hospital pharmacies with ward management and electronic prescriptions.',
        price: 999,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 20480,  // 20GB
        multiStore: false
    },
    {
        name: 'hospital_yearly',
        displayName: 'Hospital Pharmacy - Yearly',
        description: 'Annual plan for hospital pharmacies. Save 17% with yearly billing.',
        price: 9999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 20480,
        multiStore: false
    },
    {
        name: 'multichain_custom',
        displayName: 'Multi-Chain - Custom',
        description: 'Custom solution for pharmacy chains with multiple locations.',
        price: 0,  // Custom pricing
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: null,  // Unlimited
        multiStore: true
    }
];

async function seedSubscriptionPlans() {
    console.log('🌱 Seeding subscription plans...');

    try {
        for (const plan of subscriptionPlans) {
            const result = await prisma.subscriptionPlan.upsert({
                where: { name: plan.name },
                update: plan,  // Update if exists
                create: plan
            });

            console.log(`   ✅ ${result.displayName} (₹${result.price}/${result.billingCycle})`);
        }

        console.log('✅ Subscription plans seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding subscription plans:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    seedSubscriptionPlans()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { seedSubscriptionPlans };
