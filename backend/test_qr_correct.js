// Test UPI QR Code with correct API usage
const upiqrcode = require('upiqrcode').default;

async function testQR() {
    try {
        console.log('Testing UPI QR Code...\n');

        const result = await upiqrcode({
            payeeVPA: 'test@paytm',
            payeeName: 'Test Store',
            amount: '400.00',
            transactionNote: 'Invoice Payment',
        });

        console.log('✅ Success!');
        console.log('Result keys:', Object.keys(result));
        console.log('QR (base64 PNG) length:', result.qr.length);
        console.log('Intent URL:', result.intent);
        console.log('\nQR code starts with:', result.qr.substring(0, 50));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testQR();
