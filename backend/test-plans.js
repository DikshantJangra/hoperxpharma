require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = process.env.DIRECT_URL;
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating/updating subscription plans...');

  await prisma.subscriptionPlan.upsert({
    where: { name: 'retail_starter' },
    update: {
      displayName: 'Retail Starter',
      price: 499,
      billingCycle: 'monthly'
    },
    create: {
      name: 'retail_starter',
      displayName: 'Retail Starter',
      description: 'Perfect for small retail pharmacies',
      price: 499,
      currency: 'INR',
      billingCycle: 'monthly',
      patientLimit: 200,
      prescriptionLimit: 500,
      storageLimit: 500,
      multiStore: false
    }
  });

  await prisma.subscriptionPlan.upsert({
    where: { name: 'retail_pro' },
    update: {
      displayName: 'Retail Pro',
      price: 999,
      billingCycle: 'monthly'
    },
    create: {
      name: 'retail_pro',
      displayName: 'Retail Pro',
      description: 'For growing retail pharmacies',
      price: 999,
      currency: 'INR',
      billingCycle: 'monthly',
      patientLimit: 1000,
      prescriptionLimit: null,
      storageLimit: 2000,
      multiStore: false
    }
  });

  console.log('✅ Plans created/updated successfully!');
  
  const plans = await prisma.subscriptionPlan.findMany({
    where: { name: { contains: 'retail' } }
  });
  
  console.log('\n📋 Retail plans:');
  plans.forEach(p => console.log(`   - ${p.displayName}: ₹${p.price}/month`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
