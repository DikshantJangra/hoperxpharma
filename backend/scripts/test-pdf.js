const pdfService = require('../src/services/pdf/pdfService');
const fs = require('fs');
const path = require('path');

async function testPDFGeneration() {
    console.log('🧪 Testing PDF Generation...');

    const mockPO = {
        poNumber: 'PO-2023-001',
        orderDate: new Date(),
        status: 'DRAFT',
        store: {
            displayName: 'HopeRx Pharmacy',
            addressLine1: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400001',
            phoneNumber: '9876543210',
            email: 'store@hoperx.com'
        },
        supplier: {
            name: 'Cipla Distributors',
            addressLine1: '456 Pharma Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pinCode: '400002',
            contactName: 'Rajesh Kumar',
            phoneNumber: '9123456789'
        },
        poItems: [
            {
                drug: { name: 'Paracetamol', strength: '500mg' },
                unitPrice: 50.00,
                quantityOrdered: 100
            },
            {
                drug: { name: 'Azithromycin', strength: '250mg' },
                unitPrice: 120.00,
                quantityOrdered: 50
            }
        ],
        subtotal: 11000.00,
        taxAmount: 1320.00
    };

    try {
        const pdfBuffer = await pdfService.generatePOPdf(mockPO);
        const outputPath = path.join(__dirname, 'test-po.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`✅ PDF generated successfully at: ${outputPath}`);
    } catch (error) {
        console.error('❌ PDF generation failed:', error);
    }
}

testPDFGeneration();
