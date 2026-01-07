import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for HopeRxPharma E2E Testing
 * 
 * This configuration supports:
 * - Multiple browsers (Chromium, Firefox, WebKit)
 * - Parallel execution with worker-level isolation
 * - Trace-on-first-retry for efficient debugging
 * - Storage state for authenticated sessions
 * - Custom reporting with screenshots and network logs
 */

export default defineConfig({
    testDir: './playwright/tests',

    // Test timeout: 60 seconds per test
    timeout: 60 * 1000,

    // Global timeout for entire suite: 30 minutes
    globalTimeout: 30 * 60 * 1000,

    // Expect timeout: 10 seconds for assertions
    expect: {
        timeout: 10 * 1000,
    },

    // Fail fast: stop after 5 failures
    maxFailures: process.env.CI ? 5 : undefined,

    // Run tests in files in parallel
    fullyParallel: true,

    // Forbid test.only in CI
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Number of parallel workers
    workers: process.env.CI ? 2 : undefined,

    // Reporter configuration
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['json', { outputFile: 'playwright-report/results.json' }],
        ['list'],
        ...(process.env.CI ? [['github'] as ['github']] : []),
    ],

    // Global setup/teardown
    globalSetup: './playwright/config/global-setup.ts',
    globalTeardown: './playwright/config/global-teardown.ts',

    // Shared settings for all projects
    use: {
        // Base URL for navigation
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

        // Collect trace on first retry
        trace: 'on-first-retry',

        // Screenshot on failure
        screenshot: 'only-on-failure',

        // Video on first retry
        video: 'retain-on-failure',

        // Browser context options
        viewport: { width: 1280, height: 720 },

        // Navigation timeout
        navigationTimeout: 30 * 1000,

        // Action timeout
        actionTimeout: 10 * 1000,
    },

    // Configure projects for major browsers
    projects: [
        // Setup project for authentication
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },

        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Use saved authentication state
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        // Mobile viewports for responsive testing
        {
            name: 'mobile-chrome',
            use: {
                ...devices['Pixel 5'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        {
            name: 'mobile-safari',
            use: {
                ...devices['iPhone 13'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },
    ],

    // Run local dev server before tests (optional)
    webServer: process.env.CI ? undefined : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
