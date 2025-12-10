// Test UPI QR Code Generation with correct import
const UPIQRCode = require('upiqrcode').default;

async function testQRGeneration() {
    try {
        console.log('Testing UPI QR Code Generation...\n');
        console.log('UPIQRCode type:', typeof UPIQRCode);

        const qrCode = new UPIQRCode({
            payeeVPA: 'test@paytm',
            payeeName: 'Test Store',
            amount: '400.00',
            transactionNote: 'Invoice Payment',
        });

        console.log('QR Code instance created');

        const qrDataUrl = await qrCode.toDataURL();

        console.log('\n✅ Success!');
        console.log('QR Data URL length:', qrDataUrl.length);
        console.log('QR Data URL starts with:', qrDataUrl.substring(0, 50));
        console.log('\nThis is a base64 PNG data URL that can be embedded in HTML');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testQRGeneration();
