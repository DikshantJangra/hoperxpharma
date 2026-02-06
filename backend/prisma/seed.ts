import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // ============================================================================
    // 1. SUBSCRIPTION PLANS
    // ============================================================================
    console.log('📦 Creating subscription plans...')

    const freeTrial = await prisma.subscriptionPlan.upsert({
        where: { name: 'free_trial' },
        update: {},
        create: {
            name: 'free_trial',
            displayName: 'Free Trial',
            description: '14-day free trial with limited features',
            price: 0,
            currency: 'INR',
            billingCycle: 'monthly',
            patientLimit: 50,
            prescriptionLimit: 100,
            storageLimit: 100, // MB
            multiStore: false
        }
    })

    const basicPlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'basic' },
        update: {},
        create: {
            name: 'basic',
            displayName: 'Basic Plan',
            description: 'Perfect for small pharmacies',
            price: 999,
            currency: 'INR',
            billingCycle: 'monthly',
            patientLimit: 500,
            prescriptionLimit: null, // unlimited
            storageLimit: 1000, // 1GB
            multiStore: false
        }
    })

    const proPlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'pro' },
        update: {},
        create: {
            name: 'pro',
            displayName: 'Pro Plan',
            description: 'For growing pharmacy chains',
            price: 2999,
            currency: 'INR',
            billingCycle: 'monthly',
            patientLimit: null, // unlimited
            prescriptionLimit: null,
            storageLimit: 5000, // 5GB
            multiStore: true
        }
    })

    const enterprisePlan = await prisma.subscriptionPlan.upsert({
        where: { name: 'enterprise' },
        update: {},
        create: {
            name: 'enterprise',
            displayName: 'Enterprise',
            description: 'Custom solution for large chains',
            price: 0, // Custom pricing
            currency: 'INR',
            billingCycle: 'yearly',
            patientLimit: null,
            prescriptionLimit: null,
            storageLimit: null, // unlimited
            multiStore: true
        }
    })

    console.log('✅ Created 4 subscription plans')

    // ============================================================================
    // 2. ROLES & PERMISSIONS
    // ============================================================================
    console.log('🔐 Creating roles and permissions...')

    const permissions = [
        { code: 'patient.create', name: 'Create Patients', description: 'Create new patients', category: 'patient', resource: 'patient' },
        { code: 'patient.read', name: 'View Patients', description: 'View patient information', category: 'patient', resource: 'patient' },
        { code: 'patient.update', name: 'Update Patients', description: 'Update patient information', category: 'patient', resource: 'patient' },
        { code: 'patient.delete', name: 'Delete Patients', description: 'Delete patients', category: 'patient', resource: 'patient' },
        { code: 'prescription.create', name: 'Create Prescriptions', description: 'Create prescriptions', category: 'prescription', resource: 'prescription' },
        { code: 'prescription.read', name: 'View Prescriptions', description: 'View prescriptions', category: 'prescription', resource: 'prescription' },
        { code: 'prescription.update', name: 'Update Prescriptions', description: 'Update prescriptions', category: 'prescription', resource: 'prescription' },
        { code: 'prescription.delete', name: 'Delete Prescriptions', description: 'Delete prescriptions', category: 'prescription', resource: 'prescription' },
        { code: 'dispense.create', name: 'Dispense Medications', description: 'Dispense medications', category: 'dispense', resource: 'dispense' },
        { code: 'inventory.read', name: 'View Inventory', description: 'View inventory', category: 'inventory', resource: 'inventory' },
        { code: 'inventory.adjust', name: 'Adjust Inventory', description: 'Adjust inventory', category: 'inventory', resource: 'inventory' },
        { code: 'sale.create', name: 'Create Sales', description: 'Create sales', category: 'sale', resource: 'sale' },
        { code: 'sale.read', name: 'View Sales', description: 'View sales', category: 'sale', resource: 'sale' },
        { code: 'po.create', name: 'Create POs', description: 'Create purchase orders', category: 'procurement', resource: 'po' },
        { code: 'po.approve', name: 'Approve POs', description: 'Approve purchase orders', category: 'procurement', resource: 'po' },
        { code: 'expense.create', name: 'Create Expenses', description: 'Create expenses', category: 'finance', resource: 'expense' },
        { code: 'expense.approve', name: 'Approve Expenses', description: 'Approve expenses', category: 'finance', resource: 'expense' },
        { code: 'reports.view', name: 'View Reports', description: 'View reports', category: 'reports', resource: 'reports' },
        { code: 'settings.manage', name: 'Manage Settings', description: 'Manage store settings', category: 'settings', resource: 'settings' },
        { code: 'users.manage', name: 'Manage Users', description: 'Manage users', category: 'users', resource: 'users' }
    ]

    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { code: perm.code },
            update: {},
            create: perm
        })
    }

    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full system access'
        }
    })

    const pharmacistRole = await prisma.role.upsert({
        where: { name: 'Pharmacist' },
        update: {},
        create: {
            name: 'Pharmacist',
            description: 'Can dispense medications and manage inventory'
        }
    })

    const technicianRole = await prisma.role.upsert({
        where: { name: 'Technician' },
        update: {},
        create: {
            name: 'Technician',
            description: 'Can assist with dispensing'
        }
    })

    // Assign all permissions to Admin
    const allPermissions = await prisma.permission.findMany()
    for (const perm of allPermissions) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: perm.id
            }
        })
    }

    console.log('✅ Created roles and permissions')

    // ============================================================================
    // 3. SAMPLE STORE
    // ============================================================================
    console.log('🏪 Creating demo store...')

    const demoStore = await prisma.store.upsert({
        where: { email: 'demo@hoperxpharma.com' },
        update: {},
        create: {
            name: 'HopeRx Demo Pharmacy',
            displayName: 'HopeRx Demo',
            email: 'demo@hoperxpharma.com',
            phoneNumber: '+919876543210',
            businessType: 'Retail Pharmacy',
            addressLine1: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400001',
            is24x7: false,
            homeDelivery: true
        }
    })

    await prisma.storeCreditPolicy.upsert({
        where: { storeId: demoStore.id },
        update: {},
        create: {
            storeId: demoStore.id
        }
    })

    // Add subscription to demo store
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    await prisma.subscription.upsert({
        where: { storeId: demoStore.id },
        update: {},
        create: {
            storeId: demoStore.id,
            planId: proPlan.id,
            status: 'TRIAL',
            trialEndsAt,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEndsAt,
            autoRenew: true
        }
    })

    // Add usage quota
    const subscription = await prisma.subscription.findUnique({
        where: { storeId: demoStore.id }
    })

    await prisma.usageQuota.upsert({
        where: { subscriptionId: subscription!.id },
        update: {},
        create: {
            subscriptionId: subscription!.id,
            patientCountUsed: 0,
            prescriptionCountUsed: 0,
            storageMbUsed: 0,
            resetsAt: trialEndsAt
        }
    })

    console.log('✅ Created demo store with trial subscription')

    // ============================================================================
    // 4. SAMPLE USERS
    // ============================================================================
    console.log('👤 Creating demo users...')

    const hashedPassword = await bcrypt.hash('demo123', 10)

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            phoneNumber: '+919876543211',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
            isActive: true
        }
    })

    const pharmacistUser = await prisma.user.upsert({
        where: { email: 'pharmacist@demo.com' },
        update: {},
        create: {
            email: 'pharmacist@demo.com',
            phoneNumber: '+919876543212',
            passwordHash: hashedPassword,
            firstName: 'Pharmacist',
            lastName: 'User',
            role: 'PHARMACIST',
            isActive: true
        }
    })

    // Assign users to demo store
    await prisma.storeUser.upsert({
        where: {
            userId_storeId: {
                userId: adminUser.id,
                storeId: demoStore.id
            }
        },
        update: {},
        create: {
            userId: adminUser.id,
            storeId: demoStore.id,
            isPrimary: true
        }
    })

    await prisma.storeUser.upsert({
        where: {
            userId_storeId: {
                userId: pharmacistUser.id,
                storeId: demoStore.id
            }
        },
        update: {},
        create: {
            userId: pharmacistUser.id,
            storeId: demoStore.id,
            isPrimary: false
        }
    })

    console.log('✅ Created 2 demo users')

    // ============================================================================
    // 5. TAX RATES (Common HSN codes for pharmaceuticals)
    // ============================================================================
    console.log('💰 Creating tax rates...')

    const taxRates = [
        { hsnCode: '3003', gstRate: 12, description: 'Medicaments (allopathic)' },
        { hsnCode: '3004', gstRate: 12, description: 'Medicaments (packaged)' },
        { hsnCode: '3006', gstRate: 12, description: 'Pharmaceutical goods' },
        { hsnCode: '9021', gstRate: 12, description: 'Orthopaedic appliances' },
        { hsnCode: '3005', gstRate: 12, description: 'Wadding, gauze, bandages' }
    ]

    for (const rate of taxRates) {
        await prisma.taxRate.upsert({
            where: { hsnCode: rate.hsnCode },
            update: {},
            create: rate
        })
    }

    console.log('✅ Created tax rates')

    // ============================================================================
    // 6. EXPENSE CATEGORIES
    // ============================================================================
    console.log('📊 Creating expense categories...')

    const categories = [
        { name: 'Rent', description: 'Store rent', glAccount: '5001' },
        { name: 'Salaries', description: 'Employee salaries', glAccount: '5002' },
        { name: 'Utilities', description: 'Electricity, water, etc.', glAccount: '5003' },
        { name: 'Marketing', description: 'Advertising and promotions', glAccount: '5004' },
        { name: 'Supplies', description: 'Office supplies', glAccount: '5005' },
        { name: 'Maintenance', description: 'Equipment maintenance', glAccount: '5006' }
    ]

    for (const category of categories) {
        await prisma.expenseCategory.upsert({
            where: { name: category.name },
            update: {},
            create: category
        })
    }

    console.log('✅ Created expense categories')

    // NOTE: Sample drugs and inventory are NOT created in seed
    // Each store should add their own inventory through the proper workflow
    // (Purchase Orders -> GRN -> Inventory)

    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📝 Demo Credentials:')
    console.log('   Admin: admin@demo.com / demo123')
    console.log('   Pharmacist: pharmacist@demo.com / demo123')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
