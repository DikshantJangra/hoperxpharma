/**
 * Reporting Utilities
 * 
 * Enhanced test reporting and diagnostics utilities for better observability.
 * Provides helpers for:
 * - Screenshot capture on failure
 * - Test metadata attachment
 * - Performance metrics tracking
 * - Custom annotations
 */

import { Page, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Attach screenshot to test report
 */
export async function captureScreenshot(
    page: Page,
    testInfo: TestInfo,
    name: string = 'screenshot'
): Promise<void> {
    const screenshot = await page.screenshot();
    await testInfo.attach(name, {
        body: screenshot,
        contentType: 'image/png',
    });
}

/**
 * Attach HTML content to test report
 */
export async function attachHTML(
    page: Page,
    testInfo: TestInfo,
    name: string = 'page-content'
): Promise<void> {
    const html = await page.content();
    await testInfo.attach(name, {
        body: html,
        contentType: 'text/html',
    });
}

/**
 * Attach JSON data to test report
 */
export async function attachJSON(
    testInfo: TestInfo,
    name: string,
    data: any
): Promise<void> {
    await testInfo.attach(name, {
        body: JSON.stringify(data, null, 2),
        contentType: 'application/json',
    });
}

/**
 * Attach console logs to test report
 */
export function attachConsoleLogs(
    page: Page,
    testInfo: TestInfo
): void {
    const logs: string[] = [];

    page.on('console', (msg) => {
        logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    testInfo.attach('console-logs', {
        body: logs.join('\n'),
        contentType: 'text/plain',
    });
}

/**
 * Performance metrics tracker
 */
export class PerformanceTracker {
    private startTime: number;
    private metrics: Record<string, number> = {};

    constructor() {
        this.startTime = Date.now();
    }

    /**
     * Mark a checkpoint
     */
    mark(label: string): void {
        this.metrics[label] = Date.now() - this.startTime;
    }

    /**
     * Get duration from start to checkpoint
     */
    getDuration(label: string): number | undefined {
        return this.metrics[label];
    }

    /**
     * Get all metrics
     */
    getAllMetrics(): Record<string, number> {
        return { ...this.metrics };
    }

    /**
     * Attach metrics to test report
     */
    async attachToTest(testInfo: TestInfo): Promise<void> {
        await attachJSON(testInfo, 'performance-metrics', this.getAllMetrics());
    }

    /**
     * Log metrics to console
     */
    logMetrics(): void {
        console.log('\n📊 Performance Metrics:');
        Object.entries(this.metrics).forEach(([label, duration]) => {
            console.log(`  ${label}: ${duration}ms`);
        });
    }
}

/**
 * Test annotations helper
 */
export const annotations = {
    /**
     * Mark test as flaky
     */
    markFlaky(testInfo: TestInfo, reason?: string): void {
        testInfo.annotations.push({
            type: 'flaky',
            description: reason || 'Test may fail intermittently',
        });
    },

    /**
     * Mark test as slow
     */
    markSlow(testInfo: TestInfo, reason?: string): void {
        testInfo.annotations.push({
            type: 'slow',
            description: reason || 'Test takes longer than usual',
        });
    },

    /**
     * Add custom annotation
     */
    add(testInfo: TestInfo, type: string, description: string): void {
        testInfo.annotations.push({ type, description });
    },

    /**
     * Add issue/bug reference
     */
    linkIssue(testInfo: TestInfo, issueNumber: string): void {
        testInfo.annotations.push({
            type: 'issue',
            description: `#${issueNumber}`,
        });
    },
};

/**
 * Create detailed error report
 */
export async function createErrorReport(
    page: Page,
    testInfo: TestInfo,
    error: Error
): Promise<void> {
    // Capture screenshot
    await captureScreenshot(page, testInfo, 'error-screenshot');

    // Attach page HTML
    await attachHTML(page, testInfo, 'error-page-html');

    // Attach error details
    await attachJSON(testInfo, 'error-details', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        url: page.url(),
        timestamp: new Date().toISOString(),
    });
}

/**
 * Test execution summary
 */
export interface TestExecutionSummary {
    testName: string;
    duration: number;
    status: 'passed' | 'failed' | 'skipped';
    retries: number;
    errors?: string[];
    metadata?: Record<string, any>;
}

/**
 * Save test summary to file
 */
export async function saveTestSummary(
    testInfo: TestInfo,
    summary: TestExecutionSummary,
    outputDir: string = 'test-results'
): Promise<void> {
    const fileName = `${testInfo.title.replace(/\s+/g, '-')}-summary.json`;
    const filePath = path.join(outputDir, fileName);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
}

/**
 * Enhanced console logger with formatting
 */
export const logger = {
    /**
     * Log test step
     */
    step(message: string): void {
        console.log(`\n🔵 ${message}`);
    },

    /**
     * Log success
     */
    success(message: string): void {
        console.log(`✅ ${message}`);
    },

    /**
     * Log warning
     */
    warn(message: string): void {
        console.log(`⚠️  ${message}`);
    },

    /**
     * Log error
     */
    error(message: string): void {
        console.log(`❌ ${message}`);
    },

    /**
     * Log info
     */
    info(message: string): void {
        console.log(`ℹ️  ${message}`);
    },

    /**
     * Log section header
     */
    section(title: string): void {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`  ${title}`);
        console.log(`${'='.repeat(50)}\n`);
    },
};
