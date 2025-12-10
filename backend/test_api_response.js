// Test the actual API endpoint to see what getMyStore returns
const fetch = require('node-fetch');

async function testGetMyStoreAPI() {
    try {
        console.log('=== Testing /api/v1/stores/me Endpoint ===\n');

        // You'll need to get a valid token from your browser localStorage
        const token = 'YOUR_TOKEN_HERE'; // Replace with actual token

        const response = await fetch('http://localhost:8000/api/v1/stores/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response body:', text);
            return;
        }

        const data = await response.json();

        console.log('API Response:');
        console.log(JSON.stringify(data, null, 2));

        console.log('\n--- Checking bankDetails ---');
        if (data.data) {
            console.log('bankDetails in response:', data.data.bankDetails);
            console.log('logoUrl in response:', data.data.logoUrl);
            console.log('signatureUrl in response:', data.data.signatureUrl);
            console.log('settings in response:', data.data.settings);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

console.log('To run this test:');
console.log('1. Open browser dev tools on localhost:3000');
console.log('2. Run: localStorage.getItem("accessToken")');
console.log('3. Copy the token and replace YOUR_TOKEN_HERE in this file');
console.log('4. Run: node test_api_response.js\n');

// Uncomment to run if you have a token:
// testGetMyStoreAPI();
