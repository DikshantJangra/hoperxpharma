/**
 * Authentication Utilities
 * 
 * Provides helpers for:
 * - Token extraction from cookies
 * - Token validation
 * - Session management
 */

import { Page, BrowserContext } from '@playwright/test';

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Extract auth tokens from browser context
 */
export async function getAuthTokens(context: BrowserContext): Promise<AuthTokens | null> {
    const cookies = await context.cookies();

    const accessTokenCookie = cookies.find(c => c.name === 'accessToken');
    const refreshTokenCookie = cookies.find(c => c.name === 'refreshToken');

    if (!accessTokenCookie || !refreshTokenCookie) {
        return null;
    }

    return {
        accessToken: accessTokenCookie.value,
        refreshToken: refreshTokenCookie.value,
    };
}

/**
 * Wait for authentication tokens to be set
 */
export async function waitForAuthTokens(
    page: Page,
    timeout: number = 5000
): Promise<AuthTokens> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const tokens = await getAuthTokens(page.context());
        if (tokens) {
            return tokens;
        }
        await page.waitForTimeout(100);
    }

    throw new Error('Authentication tokens not found within timeout');
}

/**
 * Verify user is authenticated by checking for tokens and redirect
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    const tokens = await getAuthTokens(page.context());
    if (!tokens) {
        return false;
    }

    // Also check if we're not on login page
    const url = page.url();
    return !url.includes('/login') && !url.includes('/signup');
}

/**
 * Clear authentication tokens (logout)
 */
export async function clearAuthTokens(context: BrowserContext): Promise<void> {
    await context.clearCookies();
}

/**
 * Manually set auth tokens (useful for API-based login)
 */
export async function setAuthTokens(
    context: BrowserContext,
    tokens: AuthTokens,
    domain: string = 'localhost'
): Promise<void> {
    await context.addCookies([
        {
            name: 'accessToken',
            value: tokens.accessToken,
            domain,
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
        },
        {
            name: 'refreshToken',
            value: tokens.refreshToken,
            domain,
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
        },
    ]);
}

/**
 * Extract user ID from JWT token (without verification)
 */
export function extractUserIdFromToken(token: string): string | null {
    try {
        const [, payload] = token.split('.');
        if (!payload) return null;

        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
        return decoded.userId || decoded.sub || null;
    } catch {
        return null;
    }
}

/**
 * Wait for specific URL pattern after action (useful for redirects)
 */
export async function waitForNavigation(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 10000
): Promise<void> {
    await page.waitForURL(urlPattern, { timeout });
}
