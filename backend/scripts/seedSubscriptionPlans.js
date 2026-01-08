/**
 * Subscription Plans Seed Data
 * Run this to populate SubscriptionPlan table with default plans
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const subscriptionPlans = [
    // PROFESSIONAL TIER (Default/Starter)
    {
        name: 'retail_professional_monthly',
        displayName: 'Retail Professional - Monthly',
        description: 'Complete solution for retail pharmacies. Includes POS, inventory, CRM, and analytics.',
        price: 999,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 5120,
        multiStore: false
    },
    {
        name: 'retail_professional_yearly',
        displayName: 'Retail Professional - Yearly',
        description: 'Annual professional plan. Save ₹4,000 with yearly billing.',
        price: 7999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 5120,
        multiStore: false
    },

    // ENTERPRISE TIER
    {
        name: 'retail_enterprise_monthly',
        displayName: 'Retail Enterprise - Monthly',
        description: 'Premium features with AI insights, multi-store, and priority support.',
        price: 1999,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,
        multiStore: true
    },
    {
        name: 'retail_enterprise_yearly',
        displayName: 'Retail Enterprise - Yearly',
        description: 'Annual enterprise plan. Save ₹8,000 with yearly billing.',
        price: 15999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,
        multiStore: true
    },

    // WHOLESALE PLANS
    {
        name: 'wholesale_professional_monthly',
        displayName: 'Wholesale Professional - Monthly',
        description: 'Bulk ordering, distributor management, and B2B features.',
        price: 1499,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,
        multiStore: false
    },
    {
        name: 'wholesale_professional_yearly',
        displayName: 'Wholesale Professional - Yearly',
        description: 'Annual wholesale plan. Save ₹6,000 with yearly billing.',
        price: 11999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 10240,
        multiStore: false
    },

    // HOSPITAL PLANS
    {
        name: 'hospital_professional_monthly',
        displayName: 'Hospital Professional - Monthly',
        description: 'Ward management, electronic prescriptions, and hospital integrations.',
        price: 2499,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 20480,
        multiStore: false
    },
    {
        name: 'hospital_professional_yearly',
        displayName: 'Hospital Professional - Yearly',
        description: 'Annual hospital plan. Save ₹10,000 with yearly billing.',
        price: 19999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: 20480,
        multiStore: false
    },

    // CHAIN/MULTI-STORE
    {
        name: 'chain_enterprise_monthly',
        displayName: 'Pharmacy Chain - Monthly',
        description: 'Multi-location management with centralized inventory and reporting.',
        price: 4999,
        currency: 'INR',
        billingCycle: 'monthly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: null,
        multiStore: true
    },
    {
        name: 'chain_enterprise_yearly',
        displayName: 'Pharmacy Chain - Yearly',
        description: 'Annual chain plan. Save ₹20,000 with yearly billing.',
        price: 39999,
        currency: 'INR',
        billingCycle: 'yearly',
        patientLimit: null,
        prescriptionLimit: null,
        storageLimit: null,
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
