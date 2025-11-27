const pdfService = require('./src/services/pdf/pdfService');
const fs = require('fs');
const path = require('path');

const mockPO = {
    poNumber: 'PO-2025-001',
    orderDate: new Date(),
    status: 'APPROVED',
    subtotal: 1000,
    taxAmount: 180,
    total: 1180,
    store: {
        displayName: 'HopeRx Main Store',
        name: 'HopeRx',
        addressLine1: '123 Health St',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400001',
        phoneNumber: '9876543210',
        email: 'store@hoperx.in',
        licenses: [{ type: 'GSTIN', number: '27AAAAA0000A1Z5' }]
    },
    supplier: {
        name: 'Best Pharma Distributors',
        addressLine1: '456 Supply Rd',
        city: 'Pune',
        state: 'Maharashtra',
        pinCode: '411001',
        gstin: '27BBBBB0000B1Z7',
        contactName: 'Rahul Kumar',
        phoneNumber: '9988776655'
    },
    items: [
        {
            drug: { name: 'Paracetamol 500mg', hsnCode: '3004', defaultUnit: 'Box' },
            quantity: 100,
            unitPrice: 10,
            gstPercent: 18,
            lineTotal: 1000,
            discountPercent: 0
        }
    ]
};

async function test() {
    try {
        console.log('Generating PDF...');
        const buffer = await pdfService.generatePOPdf(mockPO);
        fs.writeFileSync('test-po.pdf', buffer);
        console.log('PDF generated successfully: test-po.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

test();
