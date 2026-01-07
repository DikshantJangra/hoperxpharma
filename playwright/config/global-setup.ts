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
    try {
        const response = await fetch(`${env.apiURL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Backend health check failed: ${response.status}`);
        }

        console.log('✅ Backend is running and healthy\n');
    } catch (error) {
        console.error('❌ Backend health check failed:', error.message);
        throw new Error(
            `Cannot connect to backend at ${env.apiURL}. ` +
            'Please ensure the backend server is running with: cd backend && npm run dev'
        );
    }

    console.log('✅ Global setup completed successfully\n');
}

export default globalSetup;
