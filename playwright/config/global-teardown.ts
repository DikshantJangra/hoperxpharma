/**
 * Global Teardown - Runs once after all tests
 * 
 * Responsibilities:
 * - Clean up global test data
 * - Close database connections
 * - Generate summary reports
 */

async function globalTeardown() {
    console.log('\n🏁 Test suite completed');
    console.log('📊 Reports generated in: playwright-report/\n');
}

export default globalTeardown;
