/**
 * Debugging Utilities
 * 
 * Advanced debugging helpers for test failures and flaky tests.
 * Provides tools for:
 * - Network request/response logging
 * - DOM state inspection
 * - Console message capture
 * - Storage state debugging
 */

import { Page, TestInfo } from '@playwright/test';
import { attachJSON } from './reporting.util';

/**
 * Network request logger
 */
export class NetworkLogger {
    private requests: any[] = [];
    private responses: any[] = [];

    constructor(private page: Page) {
        this.setupListeners();
    }

    private setupListeners() {
        this.page.on('request', (request) => {
            this.requests.push({
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                postData: request.postData(),
                timestamp: new Date().toISOString(),
            });
        });

        this.page.on('response', (response) => {
            this.responses.push({
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                timestamp: new Date().toISOString(),
            });
        });
    }

    /**
     * Get all logged requests
     */
    getRequests(): any[] {
        return [...this.requests];
    }

    /**
     * Get all logged responses
     */
    getResponses(): any[] {
        return [...this.responses];
    }

    /**
     * Get failed requests (4xx, 5xx)
     */
    getFailedRequests(): any[] {
        return this.responses.filter(r => r.status >= 400);
    }

    /**
     * Attach network logs to test report
     */
    async attachToTest(testInfo: TestInfo): Promise<void> {
        await attachJSON(testInfo, 'network-requests', this.requests);
        await attachJSON(testInfo, 'network-responses', this.responses);

        const failed = this.getFailedRequests();
        if (failed.length > 0) {
            await attachJSON(testInfo, 'failed-requests', failed);
        }
    }

    /**
     * Clear logs
     */
    clear(): void {
        this.requests = [];
        this.responses = [];
    }
}

/**
 * Console message logger
 */
export class ConsoleLogger {
    private messages: any[] = [];

    constructor(private page: Page) {
        this.setupListener();
    }

    private setupListener() {
        this.page.on('console', (msg) => {
            this.messages.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: new Date().toISOString(),
            });
        });

        this.page.on('pageerror', (error) => {
            this.messages.push({
                type: 'error',
                text: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
            });
        });
    }

    /**
     * Get all console messages
     */
    getMessages(): any[] {
        return [...this.messages];
    }

    /**
     * Get errors only
     */
    getErrors(): any[] {
        return this.messages.filter(m => m.type === 'error');
    }

    /**
     * Attach console logs to test report
     */
    async attachToTest(testInfo: TestInfo): Promise<void> {
        await attachJSON(testInfo, 'console-messages', this.messages);

        const errors = this.getErrors();
        if (errors.length > 0) {
            await attachJSON(testInfo, 'console-errors', errors);
        }
    }

    /**
     * Clear logs
     */
    clear(): void {
        this.messages = [];
    }
}

/**
 * DOM state inspector
 */
export const domInspector = {
    /**
     * Get all input values on page
     */
    async getFormData(page: Page): Promise<Record<string, any>> {
        return await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
            const data: Record<string, any> = {};

            inputs.forEach((input: any) => {
                if (input.name || input.id) {
                    const key = input.name || input.id;
                    if (input.type === 'checkbox') {
                        data[key] = input.checked;
                    } else if (input.type === 'radio') {
                        if (input.checked) {
                            data[key] = input.value;
                        }
                    } else {
                        data[key] = input.value;
                    }
                }
            });

            return data;
        });
    },

    /**
     * Get all visible text content
     */
    async getVisibleText(page: Page): Promise<string> {
        return await page.evaluate(() => {
            return document.body.innerText;
        });
    },

    /**
     * Get element attributes
     */
    async getElementAttributes(page: Page, selector: string): Promise<Record<string, string>> {
        return await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return {};

            const attrs: Record<string, string> = {};
            for (const attr of element.attributes) {
                attrs[attr.name] = attr.value;
            }
            return attrs;
        }, selector);
    },

    /**
     * Check if element is visible
     */
    async isElementVisible(page: Page, selector: string): Promise<boolean> {
        return await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return false;

            const style = window.getComputedStyle(element);
            return style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0';
        }, selector);
    },
};

/**
 * Storage state inspector
 */
export const storageInspector = {
    /**
     * Get localStorage data
     */
    async getLocalStorage(page: Page): Promise<Record<string, any>> {
        return await page.evaluate(() => {
            const storage: Record<string, any> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                    try {
                        storage[key] = JSON.parse(localStorage.getItem(key) || '');
                    } catch {
                        storage[key] = localStorage.getItem(key);
                    }
                }
            }
            return storage;
        });
    },

    /**
     * Get sessionStorage data
     */
    async getSessionStorage(page: Page): Promise<Record<string, any>> {
        return await page.evaluate(() => {
            const storage: Record<string, any> = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) {
                    try {
                        storage[key] = JSON.parse(sessionStorage.getItem(key) || '');
                    } catch {
                        storage[key] = sessionStorage.getItem(key);
                    }
                }
            }
            return storage;
        });
    },

    /**
     * Get all cookies
     */
    async getCookies(page: Page): Promise<any[]> {
        return await page.context().cookies();
    },

    /**
     * Attach all storage data to test report
     */
    async attachToTest(page: Page, testInfo: TestInfo): Promise<void> {
        const localStorage = await this.getLocalStorage(page);
        const sessionStorage = await this.getSessionStorage(page);
        const cookies = await this.getCookies(page);

        await attachJSON(testInfo, 'localStorage', localStorage);
        await attachJSON(testInfo, 'sessionStorage', sessionStorage);
        await attachJSON(testInfo, 'cookies', cookies);
    },
};

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxAttempts?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffMultiplier?: number;
    } = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 5000,
        backoffMultiplier = 2,
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxAttempts) {
                console.log(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * backoffMultiplier, maxDelay);
            }
        }
    }

    throw lastError;
}

/**
 * Wait for condition with timeout
 */
export async function waitForCondition(
    checkFn: () => Promise<boolean> | boolean,
    options: {
        timeout?: number;
        interval?: number;
        timeoutMessage?: string;
    } = {}
): Promise<void> {
    const {
        timeout = 5000,
        interval = 100,
        timeoutMessage = 'Condition not met within timeout',
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await checkFn()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(timeoutMessage);
}

/**
 * Debug helper - dump all diagnostic info
 */
export async function dumpDiagnostics(
    page: Page,
    testInfo: TestInfo,
    networkLogger?: NetworkLogger,
    consoleLogger?: ConsoleLogger
): Promise<void> {
    console.log('\n🔍 Dumping diagnostic information...');

    // Capture screenshot
    const screenshot = await page.screenshot();
    await testInfo.attach('debug-screenshot', {
        body: screenshot,
        contentType: 'image/png',
    });

    // Capture HTML
    const html = await page.content();
    await testInfo.attach('debug-html', {
        body: html,
        contentType: 'text/html',
    });

    // Storage state
    await storageInspector.attachToTest(page, testInfo);

    // Network logs
    if (networkLogger) {
        await networkLogger.attachToTest(testInfo);
    }

    // Console logs
    if (consoleLogger) {
        await consoleLogger.attachToTest(testInfo);
    }

    // Form data
    const formData = await domInspector.getFormData(page);
    await attachJSON(testInfo, 'form-data', formData);

    console.log('✅ Diagnostics dumped to test report');
}
