require('dotenv').config({ path: 'backend/.env' });
const { chatWithGemini } = require('./src/services/chatService');

async function testService() {
    try {
        console.log('Testing chatWithGemini service...');
        const response = await chatWithGemini('What is HopeRx Pharma?');
        console.log('Response:', response);
    } catch (error) {
        console.error('Service Error:', error.message);
        if (error.response) {
            console.error('API Error Data:', error.response.data);
        }
    }
}

testService();
