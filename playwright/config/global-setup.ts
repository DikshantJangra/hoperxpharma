/**
 * Global Setup - Runs once before all tests
 * 
 * Responsibilities:
 * - Validate environment configuration
 * - Ensure backend is running
 * - Create test database if needed
 * - Set up global test data
 */

import { getEnvironment } from './environments';

async function globalSetup() {
    console.log('🚀 Starting Playwright E2E Test Suite...\n');

    const env = getEnvironment();
    console.log(`📍 Environment: ${env.name}`);
    console.log(`🌐 Base URL: ${env.baseURL}`);
    console.log(`🔌 API URL: ${env.apiURL}\n`);

    // Validate environment
    if (!env.auth.testUser.email || !env.auth.testUser.password) {
        throw new Error('Test user credentials not configured. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables.');
    }

    // Check if backend is running
    const maxRetries = 5;
    const retryInterval = 2000;

    console.log(`🔍 Checking backend health at ${env.apiURL}/api/v1/health...`);

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`${env.apiURL}/api/v1/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });

            if (response.ok) {
                console.log('✅ Backend is running and healthy\n');
                console.log('✅ Global setup completed successfully\n');
                return;
            } else {
                console.warn(`⚠️ Backend health check returned status: ${response.status}. Retrying in ${retryInterval}ms...`);
            }
        } catch (error: any) {
            console.warn(`⚠️ Attempt ${i + 1}/${maxRetries}: Backend not reachable (${error.message}). Retrying in ${retryInterval}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, retryInterval));
    }

    throw new Error(
        `Cannot connect to backend at ${env.apiURL} after ${maxRetries} attempts. ` +
        'Please ensure the backend server is running with: cd backend && npm run dev'
    );
}

export default globalSetup;
