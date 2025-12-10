const pdfService = require('./src/services/pdf/pdfService');
const fs = require('fs');
const path = require('path');

// Mock Sale Data
const mockSale = {
    invoiceNumber: 'INV-2024-001',
    invoiceType: 'GST_INVOICE',
    createdAt: new Date(),
    total: 1224.00,
    subtotal: 1000.00, // Derived approx
    taxAmount: 58.28,
    discountAmount: 215.98,
    roundOff: 0.17,

    store: {
        name: 'Hope Medicos',
        displayName: 'Hope Medicos',
        subtitle: null, // Removed dummy subtitle
        addressLine1: 'Near Sarvodaya Hospital',
        addressLine2: 'Opp. Red Cross',
        city: 'Hisar',
        state: 'Haryana',
        pinCode: '125001',
        phoneNumber: '9812080390',
        email: 'info@hoperx.com',
        gstin: '06AQMPK0456A2Z7',
        dlNumber: 'RLF20HR2025003432, RLF21HR2025003428', // Multi DL simulation
        fssai: '12345678901234',
        pan: 'AQMPK0456A',
        logoUrl: 'https://via.placeholder.com/150', // Placeholder
        signatureUrl: 'https://via.placeholder.com/100x50',
        jurisdiction: 'Hisar',
        termsAndConditions: '1. Goods once sold will not be taken back.\n2. Please check expiry date.'
    },

    patient: {
        firstName: 'BOBI',
        lastName: 'M',
        phoneNumber: '9729598948',
        gender: 'Male',
        addressLine1: '123 Main St',
        city: 'Hisar'
    },

    doctorName: 'Dr. Pravesh',

    items: [
        {
            drug: {
                name: 'VALANCE OD 500 TABLET',
                hsnCode: '30049099',
                packSize: '15 tablet',
                manufacturer: 'Sun Pharma'
            },
            batch: {
                batchNumber: 'PCL0418',
                expiryDate: new Date('2027-06-01')
            },
            quantity: 30, // 30 * 407.79 MRP vs Total 1224
            mrp: 60.00,
            price: 40.00, // Price < MRP
            lineTotal: 1200.00, // 30 * 40
            gstRate: 5,
            discount: 0
        },
        {
            drug: {
                name: 'NAPOWEL-D-500 TABLET',
                hsnCode: '30049099',
                packSize: '10 tablet'
            },
            batch: {
                batchNumber: 'ADT251334D',
                expiryDate: new Date('2027-04-01')
            },
            quantity: 10,
            mrp: 180.00, // Adjusted MRP
            price: 150.00, // Price < MRP
            lineTotal: 1500.00, // 10 * 150
            gstRate: 5
        },
        {
            drug: {
                name: 'MELTRIX-LM TABLET',
                hsnCode: '30049082',
                packSize: '10 tablet'
            },
            batch: {
                batchNumber: 'T24/0585',
                expiryDate: new Date('2026-07-01')
            },
            quantity: 30,
            mrp: 140.00, // Adjusted MRP
            price: 115.00, // Price < MRP
            lineTotal: 3450.00, // 30 * 115
            gstRate: 5
        },
        {
            drug: {
                name: 'UNIONDAM MD MINT TABLET',
                hsnCode: '30049099',
                packSize: '10 tablet'
            },
            batch: {
                batchNumber: 'UGT25772',
                expiryDate: new Date('2028-04-01')
            },
            quantity: 10,
            mrp: 55.00, // Adjusted MRP
            price: 45.00, // Price < MRP
            lineTotal: 450.00, // 10 * 45
            gstRate: 5
        }
    ],

    paymentSplits: [
        { paymentMethod: 'Cash', amount: 1224.00 }
    ],

    soldByUser: {
        firstName: 'Dikshant'
    }
};

async function generate() {
    try {
        console.log('Generating PDF...');
        const buffer = await pdfService.generateSaleInvoicePdf(mockSale);
        fs.writeFileSync('test_invoice_v3.pdf', buffer);
        console.log('Success! Saved to test_invoice_v3.pdf');
    } catch (err) {
        console.error('Error:', err);
    }
}

generate();
