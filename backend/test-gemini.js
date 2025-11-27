/**
 * Test script for Gemini AI chatbot
 * Run with: node test-gemini.js
 */

const API_URL = 'http://localhost:8000/api/v1/gemini';

// Test data
const tests = [
    {
        name: 'Test 1: Basic Chat (No Auth)',
        endpoint: '/prompt/send',
        method: 'POST',
        body: {
            prompt: 'Hello! What can you help me with?'
        },
        skipAuth: true
    },
    {
        name: 'Test 2: Inventory Check (Function Calling)',
        endpoint: '/prompt/send',
        method: 'POST',
        body: {
            prompt: 'Do we have Paracetamol in stock?'
        },
        skipAuth: true
    },
    {
        name: 'Test 3: Drug Information',
        endpoint: '/prompt/send',
        method: 'POST',
        body: {
            prompt: 'Tell me about Azithromycin'
        },
        skipAuth: true
    },
    {
        name: 'Test 4: Low Stock Alerts',
        endpoint: '/prompt/send',
        method: 'POST',
        body: {
            prompt: 'What medications are running low on stock?'
        },
        skipAuth: true
    }
];

async function runTest(test) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${test.name}`);
    console.log(`${'='.repeat(60)}`);

    try {
        const url = `${API_URL}${test.endpoint}`;
        console.log(`URL: ${url}`);
        console.log(`Body:`, JSON.stringify(test.body, null, 2));

        const response = await fetch(url, {
            method: test.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(test.body)
        });

        const data = await response.json();

        console.log(`\nStatus: ${response.status}`);
        console.log(`Response:`, JSON.stringify(data, null, 2));

        if (data.success) {
            console.log(`\n✅ Test PASSED`);
        } else {
            console.log(`\n❌ Test FAILED`);
        }

        return data;

    } catch (error) {
        console.log(`\n❌ Test ERROR: ${error.message}`);
        return null;
    }
}

async function runAllTests() {
    console.log('\n🚀 Starting Gemini AI Chatbot Tests\n');
    console.log(`API URL: ${API_URL}`);
    console.log(`Make sure the backend server is running on port 8000\n`);

    for (const test of tests) {
        await runTest(test);
        // Wait 2 seconds between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ All tests completed!');
    console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runAllTests().catch(console.error);
