/**
 * Quick test script to verify onboarding fixes
 * Run with: node test-onboarding.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test data
const testUserId = 'test-user-' + Date.now();
const testStoreData = {
    name: 'Test Pharmacy',
    displayName: 'Test Pharmacy Display',
    email: `test-${Date.now()}@test.com`,
    phoneNumber: '+919876543210',
    businessType: 'Retail Pharmacy',
    addressLine1: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
};

const testLicenses = [
    {
        type: 'Drug License',
        number: 'DL-TEST-12345',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'Active',
    },
];

const testOperatingHours = [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
];

async function testOnboardingFlow() {
    console.log('🧪 Testing Onboarding Flow...\n');

    try {
        // Test 1: Create user
        console.log('1️⃣ Creating test user...');
        const user = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@test.com`,
                phoneNumber: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                passwordHash: 'test-hash',
                firstName: 'Test',
                lastName: 'User',
            },
        });
        console.log('✅ User created:', user.id);

        // Test 2: Save onboarding progress
        console.log('\n2️⃣ Testing progress save...');
        const progress = await prisma.onboardingProgress.upsert({
            where: { userId: user.id },
            update: {
                currentStep: 5,
                completedSteps: [1, 2, 3, 4, 5],
                data: { test: 'data' },
            },
            create: {
                userId: user.id,
                currentStep: 5,
                completedSteps: [1, 2, 3, 4, 5],
                data: { test: 'data' },
            },
        });
        console.log('✅ Progress saved:', progress.currentStep);

        // Test 3: Complete onboarding (create store)
        console.log('\n3️⃣ Testing store creation...');
        const store = await prisma.$transaction(async (tx) => {
            // Create store
            const createdStore = await tx.store.create({
                data: testStoreData,
            });
            console.log('✅ Store created:', createdStore.id);

            // Associate user with store
            await tx.storeUser.create({
                data: {
                    userId: user.id,
                    storeId: createdStore.id,
                    isPrimary: true,
                },
            });
            console.log('✅ User-Store association created');

            // Create licenses
            for (const license of testLicenses) {
                await tx.storeLicense.create({
                    data: {
                        ...license,
                        storeId: createdStore.id,
                    },
                });
            }
            console.log('✅ Licenses created:', testLicenses.length);

            // Create operating hours
            for (const hours of testOperatingHours) {
                await tx.storeOperatingHours.create({
                    data: {
                        ...hours,
                        storeId: createdStore.id,
                    },
                });
            }
            console.log('✅ Operating hours created:', testOperatingHours.length);

            // Mark onboarding complete
            await tx.onboardingProgress.update({
                where: { userId: user.id },
                data: {
                    isComplete: true,
                    currentStep: 10,
                    completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                },
            });
            console.log('✅ Onboarding marked complete');

            return createdStore;
        });

        // Test 4: Verify data
        console.log('\n4️⃣ Verifying created data...');
        const verifyStore = await prisma.store.findUnique({
            where: { id: store.id },
            include: {
                users: true,
                licenses: true,
                operatingHours: true,
            },
        });

        console.log('✅ Store verified:', {
            name: verifyStore.name,
            users: verifyStore.users.length,
            licenses: verifyStore.licenses.length,
            operatingHours: verifyStore.operatingHours.length,
        });

        const verifyProgress = await prisma.onboardingProgress.findUnique({
            where: { userId: user.id },
        });

        console.log('✅ Progress verified:', {
            isComplete: verifyProgress.isComplete,
            currentStep: verifyProgress.currentStep,
        });

        // Cleanup
        console.log('\n5️⃣ Cleaning up test data...');
        await prisma.storeOperatingHours.deleteMany({ where: { storeId: store.id } });
        await prisma.storeLicense.deleteMany({ where: { storeId: store.id } });
        await prisma.storeUser.deleteMany({ where: { storeId: store.id } });
        await prisma.onboardingProgress.delete({ where: { userId: user.id } });
        await prisma.store.delete({ where: { id: store.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log('✅ Cleanup complete');

        console.log('\n✅ ALL TESTS PASSED! 🎉\n');
    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run tests
testOnboardingFlow();
