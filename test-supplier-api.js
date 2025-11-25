// Quick test script to check supplier API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function testSupplierAPI() {
    console.log('🔍 Testing Supplier API...\n');
    
    // Get token from localStorage (you'll need to replace this with actual token)
    const token = 'YOUR_AUTH_TOKEN_HERE';
    
    try {
        // Test 1: Get suppliers
        console.log('1️⃣ Testing GET /suppliers');
        const response = await fetch(`${API_URL}/suppliers?page=1&limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        // Test 2: Get stats
        console.log('\n2️⃣ Testing GET /suppliers/stats');
        const statsResponse = await fetch(`${API_URL}/suppliers/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const statsData = await statsResponse.json();
        console.log('Status:', statsResponse.status);
        console.log('Response:', JSON.stringify(statsData, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testSupplierAPI();
}

module.exports = { testSupplierAPI };
