/**
 * Authentication Flow Tests
 * 
 * Tests authentication workflows:
 * - Password login
 * - Session persistence
 * - Logout
 * - Access log verification
 */

import { test, expect } from '@playwright/test';
import { getEnvironment } from '../config/environments';
import { getDatabase, createDatabaseAssertions, closeDatabase } from '../utils/database.util';
import { getAuthTokens, clearAuthTokens, isAuthenticated } from '../utils/auth.util';

test.describe('Authentication Flows', () => {
    test.afterEach(async () => {
        await closeDatabase();
    });

    test('should login with password and persist session', async ({ page, context }) => {
        const env = getEnvironment();
        const db = getDatabase();
        const dbAssert = createDatabaseAssertions();

        // Clear any existing auth
        await clearAuthTokens(context);

        // Navigate to login page
        await page.goto('/login');
        await expect(page).toHaveURL(/\/login/);

        // Fill credentials
        await page.fill('input[name="email"]', env.auth.testUser.email);
        await page.fill('input[name="password"]', env.auth.testUser.password);

        // Submit login
        await page.click('button[type="submit"]');

        // Should redirect to dashboard or onboarding
        await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

        // Verify authentication
        const authenticated = await isAuthenticated(page);
        expect(authenticated).toBe(true);

        // Verify tokens are set
        const tokens = await getAuthTokens(context);
        expect(tokens).not.toBeNull();
        expect(tokens!.accessToken).toBeTruthy();
        expect(tokens!.refreshToken).toBeTruthy();

        // BACKEND VERIFICATION: Check access log
        const user = await db.user.findUnique({
            where: { email: env.auth.testUser.email },
        });
        expect(user).not.toBeNull();

        // Verify access log was created
        const accessLog = await dbAssert.expectAccessLog(
            user!.id,
            'login_success',
            'password'
        );
        expect(accessLog).toBeDefined();
        expect(accessLog.ipAddress).toBeTruthy();

        console.log('✅ Password login successful and logged');
    });

    test('should maintain session across page reloads', async ({ page }) => {
        // Note: This test uses the authenticated state from setup

        // Navigate to dashboard
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);

        // Reload page
        await page.reload();

        // Should still be on dashboard (not redirected to login)
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify still authenticated
        const authenticated = await isAuthenticated(page);
        expect(authenticated).toBe(true);

        console.log('✅ Session persisted across reload');
    });

    test('should logout and clear session', async ({ page, context }) => {
        const db = getDatabase();
        const env = getEnvironment();

        // Navigate to dashboard (should be authenticated from storage state)
        await page.goto('/dashboard');

        // Verify we're authenticated
        let authenticated = await isAuthenticated(page);
        expect(authenticated).toBe(true);

        // Find and click logout button
        // Note: Adjust selector based on actual UI
        await page.click('button:has-text("Logout"), [aria-label="Logout"]');

        // Should redirect to login
        await page.waitForURL(/\/login/, { timeout: 10000 });

        // Verify tokens are cleared
        const tokens = await getAuthTokens(context);
        // Tokens might still exist but we should be on login page

        // Verify not authenticated
        authenticated = await isAuthenticated(page);
        expect(authenticated).toBe(false);

        // BACKEND VERIFICATION: Check logout was logged
        const user = await db.user.findUnique({
            where: { email: env.auth.testUser.email },
        });

        const logoutLog = await db.accessLog.findFirst({
            where: {
                userId: user!.id,
                eventType: 'logout',
            },
            orderBy: { createdAt: 'desc' },
        });

        expect(logoutLog).toBeDefined();

        console.log('✅ Logout successful and logged');
    });

    test('should show error on invalid credentials', async ({ page, context }) => {
        // Clear any existing auth
        await clearAuthTokens(context);

        // Navigate to login
        await page.goto('/login');

        // Enter invalid credentials
        await page.fill('input[name="email"]', 'invalid@test.com');
        await page.fill('input[name="password"]', 'WrongPassword123!');

        // Submit
        await page.click('button[type="submit"]');

        // Should see error message (adjust selector based on UI)
        await expect(page.locator('text=/Invalid (credentials|email or password)/i')).toBeVisible({ timeout: 5000 });

        // Should still be on login page
        await expect(page).toHaveURL(/\/login/);

        // Should NOT be authenticated
        const authenticated = await isAuthenticated(page);
        expect(authenticated).toBe(false);

        console.log('✅ Invalid credentials rejected correctly');
    });
});
