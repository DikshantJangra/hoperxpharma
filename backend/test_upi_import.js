// Test UPI QR Code - trying different import methods
async function testImports() {
    console.log('=== Testing upiqrcode module ===\n');

    try {
        // Try 1: Default export
        const UPI1 = require('upiqrcode');
        console.log('1. Default export type:', typeof UPI1);
        console.log('   Constructor?', typeof UPI1 === 'function');

        // Try 2: Check if it's an object with a class
        if (typeof UPI1 === 'object') {
            console.log('   Keys:', Object.keys(UPI1));
            console.log('   UPIQRCode property?', UPI1.UPIQRCode);
        }

        // Try 3: Try using it
        if (typeof UPI1 === 'function') {
            const qr = new UPI1({
                payeeVPA: 'test@paytm',
                payeeName: 'Test',
                amount: '100'
            });
            const url = await qr.toDataURL();
            console.log('\n✅ QR Generated! Length:', url.length);
        } else if (UPI1.default) {
            console.log('\n2. Trying UPI1.default...');
            const qr = new UPI1.default({
                payeeVPA: 'test@paytm',
                payeeName: 'Test',
                amount: '100'
            });
            const url = await qr.toDataURL();
            console.log('✅ QR Generated! Length:', url.length);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testImports();
