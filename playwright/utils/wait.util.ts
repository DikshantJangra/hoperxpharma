/**
 * Wait Utilities - Smart waiting strategies
 * 
 * Provides reliable wait helpers for various scenarios
 */

import { Page, Locator } from '@playwright/test';

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(
    page: Page,
    timeout: number = 5000
): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for API response matching pattern
 */
export async function waitForAPIResponse(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 10000
): Promise<any> {
    const response = await page.waitForResponse(
        resp => {
            const url = resp.url();
            if (typeof urlPattern === 'string') {
                return url.includes(urlPattern);
            }
            return urlPattern.test(url);
        },
        { timeout }
    );

    return response.json();
}

/**
 * Wait for element to be visible and stable (not animating)
 */
export async function waitForStable(
    locator: Locator,
    timeout: number = 5000
): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });

    // Wait for animations to complete
    await locator.evaluate(el => {
        return Promise.all(
            el.getAnimations().map(animation => animation.finished)
        );
    });
}

/**
 * Wait for condition to be true with polling
 */
export async function waitForCondition(
    condition: () => Promise<boolean>,
    options: {
        timeout?: number;
        interval?: number;
        timeoutMessage?: string;
    } = {}
): Promise<void> {
    const {
        timeout = 10000,
        interval = 100,
        timeoutMessage = 'Condition not met within timeout',
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await condition()) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(timeoutMessage);
}

/**
 * Wait for element count to match expected
 */
export async function waitForElementCount(
    locator: Locator,
    expectedCount: number,
    timeout: number = 5000
): Promise<void> {
    await waitForCondition(
        async () => (await locator.count()) === expectedCount,
        {
            timeout,
            timeoutMessage: `Expected ${expectedCount} elements, but count didn't match within timeout`,
        }
    );
}

/**
 * Wait for text content to change
 */
export async function waitForTextChange(
    locator: Locator,
    timeout: number = 5000
): Promise<string> {
    const initialText = await locator.textContent();

    await waitForCondition(
        async () => {
            const currentText = await locator.textContent();
            return currentText !== initialText;
        },
        {
            timeout,
            timeoutMessage: 'Text content did not change within timeout',
        }
    );

    return (await locator.textContent()) || '';
}
