const csv = require('csv-parser');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Or import your prisma instance

const TEMPLATES = {
    INVENTORY: [
        'drugName', 'genericName', 'batchNumber', 'expiryDate', 'quantity', 'mrp', 'purchasePrice', 'gstRate', 'hsnCode', 'supplierName', 'location'
    ],
    PATIENTS: [
        'name', 'phone', 'email', 'gender', 'age', 'address', 'allergies', 'chronicConditions'
    ],
    SUPPLIERS: [
        'name', 'phone', 'email', 'gstNumber', 'licenseNumber', 'address', 'creditPeriodDays'
    ],
    SALES: [
        'invoiceNumber', 'date', 'customerPhone', 'totalAmount', 'paymentMethod'
    ]
};

const SAMPLE_DATA = {
    INVENTORY: 'Dolo 650,Paracetamol,BATCH001,2025-12-31,100,30.50,22.00,12,3004,Main Supplier,Rack A1',
    PATIENTS: 'Rahul Sharma,9876543210,rahul@example.com,MALE,35,123 Main St,Peanuts,Diabetes',
    SUPPLIERS: 'MedLife Distributors,9988776655,orders@medlife.com,29ABCDE1234F1Z5,DL-12345,Bangalore,30',
    SALES: 'INV-001,2024-01-01,9876543210,150.00,Cash'
};

const getTemplate = (type) => {
    const headers = TEMPLATES[type.toUpperCase()];
    if (!headers) throw new Error('Invalid template type');
    return headers.join(',') + '\n' + SAMPLE_DATA[type.toUpperCase()];
};

const processImport = (type, filePath, storeId, userId) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const errors = [];
        let successCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Process data in transaction
                try {
                    await prisma.$transaction(async (tx) => {
                        for (const row of results) {
                            try {
                                await importRow(tx, type, row, storeId, userId);
                                successCount++;
                            } catch (err) {
                                errors.push({ row: row, error: err.message });
                            }
                        }
                    });

                    // Cleanup file
                    fs.unlinkSync(filePath);

                    resolve({ success: true, count: successCount, errors });
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => reject(error));
    });
};

const importRow = async (tx, type, row, storeId, userId) => {
    switch (type.toUpperCase()) {
        case 'INVENTORY':
            return importInventory(tx, row, storeId);
        case 'PATIENTS':
            return importPatient(tx, row, storeId);
        case 'SUPPLIERS':
            return importSupplier(tx, row, storeId);
        case 'SALES':
            return importSale(tx, row, storeId, userId);
        default:
            throw new Error('Unknown import type');
    }
};

const importInventory = async (tx, row, storeId) => {
    if (!row.drugName || !row.batchNumber) throw new Error('Missing required fields');

    // Find or create supplier if provided
    let supplierId = null;
    if (row.supplierName) {
        let supplier = await tx.supplier.findFirst({
            where: { storeId, name: row.supplierName }
        });

        if (!supplier) {
            supplier = await tx.supplier.create({
                data: {
                    name: row.supplierName,
                    storeId,
                    category: 'Distributor',
                    phoneNumber: '0000000000',
                    addressLine1: 'Imported Address',
                    city: 'Imported City',
                    state: 'Imported State',
                    pinCode: '000000',
                    contactName: row.supplierName
                }
            });
        }
        supplierId = supplier.id;
    }

    // Create Inventory Item (Drug)
    let drug = await tx.inventory.findFirst({
        where: { storeId, drugName: row.drugName }
    });

    if (!drug) {
        drug = await tx.inventory.create({
            data: {
                storeId,
                drugName: row.drugName,
                genericName: row.genericName || '',
                type: 'MEDICINE',
                manufacturer: 'Unknown',
                gstRate: parseFloat(row.gstRate) || 12,
                hsnCode: row.hsnCode || '',
                minStockLevel: 10,
                location: row.location || ''
            }
        });
    }

    // Create Batch
    await tx.inventoryBatch.create({
        data: {
            inventoryId: drug.id,
            batchNumber: row.batchNumber,
            expiryDate: new Date(row.expiryDate),
            quantity: parseInt(row.quantity) || 0,
            mrp: parseFloat(row.mrp) || 0,
            purchasePrice: parseFloat(row.purchasePrice) || 0,
            supplierId
        }
    });
};

const importPatient = async (tx, row, storeId) => {
    if (!row.name || !row.phone) throw new Error('Name and Phone are required');

    await tx.patient.create({
        data: {
            storeId,
            name: row.name,
            phone: row.phone,
            email: row.email || null,
            gender: row.gender ? row.gender.toUpperCase() : 'OTHER',
            age: row.age ? parseInt(row.age) : null,
            address: row.address || null,
            allergies: row.allergies ? [row.allergies] : [],
            chronicConditions: row.chronicConditions ? [row.chronicConditions] : []
        }
    });
};

const importSupplier = async (tx, row, storeId) => {
    if (!row.name) throw new Error('Name is required');

    await tx.supplier.create({
        data: {
            storeId,
            name: row.name,
            phone: row.phone || '',
            email: row.email || null,
            gstNumber: row.gstNumber || null,
            licenseNumber: row.licenseNumber || null,
            address: row.address || null,
            creditPeriodDays: row.creditPeriodDays ? parseInt(row.creditPeriodDays) : 0,
            type: 'DISTRIBUTOR'
        }
    });
};

const importSale = async (tx, row, storeId, userId) => {
    // Simple sales import (just header, no items as items are complex to link)
    // This serves as "Past History" record
    if (!row.totalAmount || !row.date) throw new Error('Date and Amount required');

    await tx.sale.create({
        data: {
            storeId,
            invoiceNumber: row.invoiceNumber || `IMP-${Date.now()}`,
            saleDate: new Date(row.date),
            totalAmount: parseFloat(row.totalAmount),
            subTotal: parseFloat(row.totalAmount), // Assuming inclusive
            status: 'COMPLETED',
            paymentMethod: row.paymentMethod || 'Cash',
            paymentStatus: 'PAID',
            customerName: row.customerPhone ? `Customer ${row.customerPhone}` : 'Walk-in',
            customerPhone: row.customerPhone || null,
            userId // Assigned to admin who imported
        }
    });
};

module.exports = {
    getTemplate,
    processImport
};
