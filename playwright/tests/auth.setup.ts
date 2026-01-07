/**
 * Authentication Setup Test
 * 
 * This runs before all other tests to:
 * - Create test users if they don't exist
 * - Perform login and save authentication state
 * - Verify backend is accessible
 */

import { test as setup, expect } from '@playwright/test';
import { getEnvironment } from '../config/environments';
import { getDatabase, closeDatabase } from '../utils/database.util';
import { waitForAuthTokens } from '../utils/auth.util';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as test user', async ({ page, context }) => {
    const env = getEnvironment();
    const db = getDatabase();

    console.log('🔐 Authenticating test user...');

    // Check if test user exists, create if not
    let testUser = await db.user.findUnique({
        where: { email: env.auth.testUser.email },
    });

    if (!testUser) {
        console.log('📝 Creating test user...');

        // Import bcrypt to hash password
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(env.auth.testUser.password, 10);

        testUser = await db.user.create({
            data: {
                email: env.auth.testUser.email,
                phoneNumber: '+919999999999',
                passwordHash,
                firstName: 'Test',
                lastName: 'User',
                role: 'ADMIN',
                isActive: true,
            },
        });

        console.log(`✅ Test user created: ${testUser.id}`);
    } else {
        console.log(`✅ Test user found: ${testUser.id}`);
    }

    // Create default test store if user has no stores
    const existingStore = await db.storeUser.findFirst({
        where: { userId: testUser.id },
    });

    if (!existingStore) {
        console.log('🏪 Creating test store...');

        const store = await db.store.create({
            data: {
                name: 'Test Pharmacy',
                displayName: 'Test Pharmacy',
                email: 'test-pharmacy@automation.com',
                phoneNumber: '+919999999998',
                addressLine1: '123 Test Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pinCode: '400001',
                isDemo: false,
            },
        });

        // Link user to store
        await db.storeUser.create({
            data: {
                userId: testUser.id,
                storeId: store.id,
                isPrimary: true,
            },
        });

        console.log(`✅ Test store created: ${store.id}`);
    }

    // Perform login via UI
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', env.auth.testUser.email);
    await page.fill('input[name="password"]', env.auth.testUser.password);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or onboarding
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Verify we have auth tokens
    const tokens = await waitForAuthTokens(page, 5000);
    expect(tokens).toBeTruthy();
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    console.log('✅ Authentication successful');

    // Save signed-in state to reuse in tests
    await context.storageState({ path: authFile });

    console.log(`💾 Authentication state saved to ${authFile}`);

    // Cleanup
    await closeDatabase();
});
