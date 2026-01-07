/**
 * Custom Playwright Test Fixtures
 * 
 * Extends base Playwright test with:
 * - Database access for backend verification
 * - Cleanup utilities for test isolation
 * - Pre-authenticated page contexts
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { getDatabase, closeDatabase, DatabaseAssertions, createDatabaseAssertions } from '../utils/database.util';
import { CleanupUtil, createCleanupUtil } from '../utils/cleanup.util';
import { getEnvironment, Environment } from '../config/environments';

/**
 * Custom fixture types
 */
export interface CustomFixtures {
    /** Prisma database client for backend verification */
    db: PrismaClient;

    /** Database assertion helpers */
    dbAssert: DatabaseAssertions;

    /** Cleanup utility for test isolation */
    cleanup: CleanupUtil;

    /** Current environment configuration */
    env: Environment;

    /** Track created entities for cleanup */
    testData: {
        userIds: string[];
        storeIds: string[];
        patientIds: string[];
        saleIds: string[];
        prescriptionIds: string[];
        poIds: string[];
        inventoryBatchIds: string[];
        drugIds: string[];
        supplierIds: string[];
    };
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
    // Provide database client
    db: async ({ }, use) => {
        const db = getDatabase();
        await use(db);
        // Don't close here - let cleanup handle it
    },

    // Provide database assertions
    dbAssert: async ({ }, use) => {
        const assertions = createDatabaseAssertions();
        await use(assertions);
    },

    // Provide cleanup utility
    cleanup: async ({ db }, use) => {
        const cleanupUtil = createCleanupUtil(db);
        await use(cleanupUtil);
    },

    // Provide environment config
    env: async ({ }, use) => {
        const env = getEnvironment();
        await use(env);
    },

    // Track test data for cleanup
    testData: async ({ cleanup }, use) => {
        const data = {
            userIds: [],
            storeIds: [],
            patientIds: [],
            saleIds: [],
            prescriptionIds: [],
            poIds: [],
            inventoryBatchIds: [],
            drugIds: [],
            supplierIds: [],
        };

        await use(data);

        // Cleanup after test
        try {
            await cleanup.cleanupTestData(data);
        } catch (error: any) {
            console.warn('Cleanup warning:', error.message);
        }
    },
});

// Re-export expect for convenience
export { expect };

/**
 * Test hooks for common setup/teardown patterns
 */
export const testHooks = {
    /**
     * After each test: close database connection
     */
    afterEach: async () => {
        await closeDatabase();
    },

    /**
     * Before all tests: verify backend is running
     */
    beforeAll: async () => {
        const env = getEnvironment();
        try {
            const response = await fetch(`${env.apiURL}/health`);
            if (!response.ok) {
                throw new Error(`Backend returned ${response.status}`);
            }
        } catch (error) {
            throw new Error(
                `Backend not available at ${env.apiURL}. ` +
                'Please start with: cd backend && npm run dev'
            );
        }
    },
};
