/**
 * Password Login Flow
 * 
 * Reusable flow for logging in with email/password
 */

import { Page } from '@playwright/test';
import { waitForAuthTokens, getAuthTokens, waitForNavigation } from '../../utils/auth.util';

export interface LoginOptions {
    email: string;
    password: string;
    expectRedirectTo?: string | RegExp;
}

export interface LoginResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    redirectedTo?: string;
    error?: string;
}

/**
 * Perform password-based login
 */
export async function performPasswordLogin(
    page: Page,
    options: LoginOptions
): Promise<LoginResult> {
    const { email, password, expectRedirectTo = /\/(dashboard|onboarding)/ } = options;

    // Navigate to login page
    await page.goto('/login');

    // Wait for form to be ready
    await page.waitForSelector('input[name="email"]', { state: 'visible' });

    // Fill credentials
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Click submit
    await page.click('button[type="submit"]');

    // Check for error message
    const errorVisible = await page.locator('text=/Invalid|Error|Failed/i').isVisible({ timeout: 2000 }).catch(() => false);

    if (errorVisible) {
        const errorText = await page.locator('[role="alert"], .error-message, text=/Invalid|Error/i').first().textContent();
        return {
            success: false,
            error: errorText || 'Login failed',
        };
    }

    // Wait for redirect
    try {
        await waitForNavigation(page, expectRedirectTo, 10000);
    } catch {
        return {
            success: false,
            error: 'Redirect timeout - login may have failed',
        };
    }

    // Get tokens
    const tokens = await waitForAuthTokens(page, 5000).catch(() => null);

    if (!tokens) {
        return {
            success: false,
            error: 'Authentication tokens not received',
        };
    }

    return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        redirectedTo: page.url(),
    };
}

/**
 * Perform logout
 */
export async function performLogout(page: Page): Promise<boolean> {
    try {
        // Try different logout button selectors
        const logoutSelectors = [
            'button:has-text("Logout")',
            'button:has-text("Sign out")',
            '[aria-label="Logout"]',
            '[data-testid="logout-button"]',
            'a:has-text("Logout")',
        ];

        for (const selector of logoutSelectors) {
            const button = page.locator(selector).first();
            if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
                await button.click();
                await page.waitForURL(/\/login/, { timeout: 5000 });
                return true;
            }
        }

        // If no button found, try navigating to logout endpoint
        await page.goto('/api/v1/auth/logout');
        await page.waitForURL(/\/login/, { timeout: 5000 });
        return true;

    } catch {
        return false;
    }
}
