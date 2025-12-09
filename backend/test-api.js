const axios = require('axios');

async function testApi() {
    try {
        // ID for 'Dikshant' from previous debug output
        const patientId = 'cmiurrj1m00011409mw75b40g'; // Using the ID from the logs/user context if possible, or try to fetch list first.

        // Wait, I need an ID. Let's use the one from the user's error message: 
        // /patients/cmiurrj1m00011409mw75b40g/invoices/unpaid
        const targetId = 'cmiurrj1m00011409mw75b40g';

        console.log(`Fetching patient ${targetId}...`);
        const response = await axios.get(`http://localhost:8000/api/v1/patients/${targetId}`);

        console.log("Status:", response.status);
        console.log("Keys in data:", Object.keys(response.data.data));
        console.log("CurrentBalance value:", response.data.data.currentBalance);
        console.log("CurrentBalance type:", typeof response.data.data.currentBalance);

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.log("Response data:", error.response.data);
        }
    }
}

testApi();
