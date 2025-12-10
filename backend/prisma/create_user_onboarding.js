const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUserWithOnboarding() {
    console.log('🚀 Creating new user with complete onboarding...\n');

    try {
        // Step 1: Create User
        console.log('Step 1: Creating user...');
        const passwordHash = await bcrypt.hash('@Dikshant1', 10);

        const user = await prisma.user.create({
            data: {
                email: 'dikshantjangra1@gmail.com',
                phoneNumber: '+919876543210', // Dummy Indian number
                passwordHash: passwordHash,
                firstName: 'Dikshant',
                lastName: 'Jangra',
                role: 'ADMIN',
                isActive: true
            }
        });
        console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})\n`);

        // Step 2: Create Store
        console.log('Step 2: Creating store...');
        const store = await prisma.store.create({
            data: {
                name: "Jangra Medicos",
                displayName: "Jangra Medicos",
                email: 'dikshantjangra1@gmail.com',
                phoneNumber: '+919876543210',
                whatsapp: '+919876543210',
                businessType: 'Retail Pharmacy',

                // Address in Haryana
                addressLine1: 'Shop No. 15, Main Market',
                addressLine2: 'Sector 12',
                landmark: 'Near City Hospital',
                city: 'Gurugram',
                state: 'Haryana',
                pinCode: '122001',

                // Regulatory info (dummy)
                gstin: '06ABCDE1234F1Z5',
                dlNumber: 'HR-GGN-20/21-12345',
                pan: 'ABCDE1234F',

                // Operations
                is24x7: false,
                homeDelivery: true,

                // HR & Geofencing (Gurugram coordinates)
                latitude: 28.4595,
                longitude: 77.0266,
                geofenceRadius: 50
            }
        });
        console.log(`✅ Created store: ${store.name}\n`);

        // Step 3: Link User to Store
        console.log('Step 3: Linking user to store...');
        await prisma.storeUser.create({
            data: {
                userId: user.id,
                storeId: store.id,
                isPrimary: true
            }
        });
        console.log('✅ User linked to store\n');

        // Step 4: Assign Admin Role
        console.log('Step 4: Assigning admin role...');
        const adminRole = await prisma.role.findUnique({
            where: { name: 'ADMIN' }
        });

        if (adminRole) {
            await prisma.userRoleAssignment.create({
                data: {
                    userId: user.id,
                    roleId: adminRole.id,
                    storeId: store.id,
                    assignedBy: user.id
                }
            });
            console.log('✅ Admin role assigned\n');
        }

        // Step 5: Create Store Settings
        console.log('Step 5: Creating store settings...');
        await prisma.storeSettings.create({
            data: {
                storeId: store.id,
                lowStockThreshold: 10,
                nearExpiryThreshold: 90,
                defaultUoM: 'Units',
                defaultGSTSlab: '12',
                batchTracking: true,
                autoGenerateCodes: true,
                purchaseRounding: false,
                allowNegativeStock: false,
                invoiceFormat: 'INV/0001',
                paymentMethods: 'Cash,Card,UPI',
                billingType: 'MRP-based',
                printFormat: 'Thermal',
                footerText: 'Thank you for your business!',
                autoRounding: true,
                defaultCustomerType: 'Walk-in',
                enableGSTBilling: true
            }
        });
        console.log('✅ Store settings created\n');

        // Step 6: Create Operating Hours (Mon-Sat: 9 AM - 9 PM, Sunday closed)
        console.log('Step 6: Creating operating hours...');
        const operatingHours = [
            { dayOfWeek: 0, isClosed: true, openTime: '00:00', closeTime: '00:00' }, // Sunday
            { dayOfWeek: 1, isClosed: false, openTime: '09:00', closeTime: '21:00' }, // Monday
            { dayOfWeek: 2, isClosed: false, openTime: '09:00', closeTime: '21:00' }, // Tuesday
            { dayOfWeek: 3, isClosed: false, openTime: '09:00', closeTime: '21:00' }, // Wednesday
            { dayOfWeek: 4, isClosed: false, openTime: '09:00', closeTime: '21:00' }, // Thursday
            { dayOfWeek: 5, isClosed: false, openTime: '09:00', closeTime: '21:00' }, // Friday
            { dayOfWeek: 6, isClosed: false, openTime: '09:00', closeTime: '21:00' }  // Saturday
        ];

        for (const hours of operatingHours) {
            await prisma.storeOperatingHours.create({
                data: {
                    storeId: store.id,
                    ...hours
                }
            });
        }
        console.log('✅ Operating hours created\n');

        // Step 7: Create a Supplier
        console.log('Step 7: Creating supplier...');
        const supplier = await prisma.supplier.create({
            data: {
                storeId: store.id,
                name: 'Delhi Pharma Distributors',
                category: 'Distributor',
                status: 'Active',
                gstin: '07XYZAB5678C1Z9',
                dlNumber: 'DL-DEL-20/21-67890',
                pan: 'XYZAB5678C',

                // Contact
                contactName: 'Rajesh Kumar',
                phoneNumber: '+919123456789',
                email: 'contact@delhipharma.com',
                whatsapp: '+919123456789',

                // Address
                addressLine1: 'Plot No. 45, Industrial Area',
                addressLine2: 'Phase 2',
                city: 'New Delhi',
                state: 'Delhi',
                pinCode: '110020',

                // Payment
                paymentTerms: 'Net 30',
                creditLimit: 500000.00
            }
        });
        console.log(`✅ Created supplier: ${supplier.name}\n`);

        // Step 8: Create Subscription (Trial)
        console.log('Step 8: Creating subscription...');
        const plan = await prisma.subscriptionPlan.findFirst({
            where: { name: 'BASIC' }
        });

        if (plan) {
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 30); // 30 days trial

            const periodEnd = new Date();
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            await prisma.subscription.create({
                data: {
                    storeId: store.id,
                    planId: plan.id,
                    status: 'TRIAL',
                    trialEndsAt: trialEnd,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: periodEnd,
                    autoRenew: true
                }
            });
            console.log('✅ Subscription created (30-day trial)\n');
        }

        // Step 9: Mark Onboarding as Complete
        console.log('Step 9: Completing onboarding...');
        await prisma.onboardingProgress.create({
            data: {
                userId: user.id,
                currentStep: 7,
                completedSteps: [1, 2, 3, 4, 5, 6, 7],
                data: {
                    businessType: 'Retail Pharmacy',
                    storeCreated: true,
                    settingsConfigured: true,
                    supplierAdded: true
                },
                isComplete: true
            }
        });
        console.log('✅ Onboarding marked as complete\n');

        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ User setup completed successfully!\n');
        console.log('📧 Email: dikshantjangra1@gmail.com');
        console.log('🔑 Password: @Dikshant1');
        console.log('🏪 Store: Jangra Medicos (Gurugram, Haryana)');
        console.log('👤 Role: ADMIN');
        console.log('📦 Supplier: Delhi Pharma Distributors');
        console.log('⏰ Operating Hours: Mon-Sat 9 AM - 9 PM (Sunday closed)');
        console.log('🎁 Subscription: 30-day trial');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error during setup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createUserWithOnboarding()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
