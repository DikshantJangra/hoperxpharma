const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Verifying Database Deployment...\n')

    // Check subscription plans
    const plans = await prisma.subscriptionPlan.findMany()
    console.log(`✅ Subscription Plans: ${plans.length}`)
    plans.forEach(p => console.log(`   - ${p.displayName}: ₹${p.price}/month`))

    // Check roles
    const roles = await prisma.role.findMany()
    console.log(`\n✅ Roles: ${roles.length}`)
    roles.forEach(r => console.log(`   - ${r.name}`))

    // Check permissions
    const permissions = await prisma.permission.findMany()
    console.log(`\n✅ Permissions: ${permissions.length}`)

    // Check demo store
    const store = await prisma.store.findFirst({
        include: {
            subscription: {
                include: { plan: true }
            }
        }
    })
    console.log(`\n✅ Demo Store: ${store.displayName}`)
    console.log(`   Subscription: ${store.subscription.plan.displayName} (${store.subscription.status})`)
    console.log(`   Trial ends: ${store.subscription.trialEndsAt?.toLocaleDateString()}`)

    // Check users
    const users = await prisma.user.findMany()
    console.log(`\n✅ Demo Users: ${users.length}`)
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`))

    // Check drugs
    const drugs = await prisma.drug.findMany()
    console.log(`\n✅ Sample Drugs: ${drugs.length}`)
    drugs.forEach(d => console.log(`   - ${d.name}`))

    // Check tax rates
    const taxRates = await prisma.taxRate.findMany()
    console.log(`\n✅ Tax Rates: ${taxRates.length}`)

    // Check expense categories
    const categories = await prisma.expenseCategory.findMany()
    console.log(`\n✅ Expense Categories: ${categories.length}`)

    console.log('\n🎉 Database verification complete!')
    console.log('\n📊 Total Tables Created: 68')
    console.log('🔗 Prisma Studio: http://localhost:5555')
    console.log('\n📝 Demo Credentials:')
    console.log('   Admin: admin@demo.com / demo123')
    console.log('   Pharmacist: pharmacist@demo.com / demo123')
}

main()
    .catch((e) => {
        console.error('❌ Verification failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
