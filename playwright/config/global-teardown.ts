/**
 * Global Teardown - Runs once after all tests
 * 
 * Responsibilities:
 * - Clean up test data (delete test user, etc.)
 * - Close database connections
 */

import { getEnvironment } from './environments';
import { cleanupTestData, closeDatabase } from '../utils/database.util';

async function globalTeardown() {
    console.log('\n🧹 Starting Global Teardown...');

    const env = getEnvironment();

    // Clean up test data if configured
    if (env.auth.testUser.email) {
        await cleanupTestData(env.auth.testUser.email);
    }

    // Close global DB connection
    await closeDatabase();

    console.log('✅ Global teardown completed successfully');
}

export default globalTeardown;
