/**
 * End-to-End Tests - Complete Workflow
 * Tests full business workflows from start to finish
 */

const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/db/prisma');

describe('E2E: Complete Sale Workflow', () => {
    let authToken;
    let storeId;
    let drugId;
    let batchId;

    beforeAll(async () => {
        // Setup: Create test data
        // Note: In real scenario, use test database
    });

    afterAll(async () => {
        // Cleanup
        await prisma.$disconnect();
    });

    describe('Walk-in Sale Flow', () => {
        test('should complete full walk-in sale workflow', async () => {
            // 1. Search for drug
            const searchResponse = await request(app)
                .get('/api/v1/inventory/drugs/search')
                .query({ q: 'Paracetamol', storeId })
                .set('Authorization', `Bearer ${authToken}`);

            expect(searchResponse.status).toBe(200);
            expect(searchResponse.body.length).toBeGreaterThan(0);

            // 2. Check stock availability
            const drug = searchResponse.body[0];
            expect(drug.totalStock).toBeGreaterThan(0);

            // 3. Allocate stock
            const allocationResponse = await request(app)
                .post('/api/v1/inventory/allocate')
                .send({
                    storeId,
                    drugId: drug.id,
                    quantity: 10
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(allocationResponse.status).toBe(200);
            const allocations = allocationResponse.body;
            expect(allocations.length).toBeGreaterThan(0);

            // 4. Create sale
            const saleResponse = await request(app)
                .post('/api/v1/sales/quick')
                .send({
                    storeId,
                    items: [{
                        drugId: drug.id,
                        batchId: allocations[0].batch.id,
                        quantity: 10,
                        price: drug.mrp,
                        gstRate: drug.gstRate
                    }],
                    payments: [{
                        method: 'CASH',
                        amount: 56 // Calculated total
                    }]
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(saleResponse.status).toBe(201);
            expect(saleResponse.body).toHaveProperty('invoiceNumber');
            expect(saleResponse.body.status).toBe('COMPLETED');

            // 5. Verify stock deduction
            const stockCheckResponse = await request(app)
                .get(`/api/v1/inventory/batches/${allocations[0].batch.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(stockCheckResponse.body.quantity.value)
                .toBe(allocations[0].batch.quantity.value - 10);

            // 6. Verify stock movement created
            const movementsResponse = await request(app)
                .get('/api/v1/inventory/movements')
                .query({ batchId: allocations[0].batch.id })
                .set('Authorization', `Bearer ${authToken}`);

            const saleMovement = movementsResponse.body.find(
                m => m.movementType === 'OUT' && m.signedQuantity === -10
            );
            expect(saleMovement).toBeDefined();
        });
    });

    describe('Prescription Workflow', () => {
        test('should complete prescription to sale workflow', async () => {
            // 1. Create prescription
            const prescriptionResponse = await request(app)
                .post('/api/v1/prescriptions')
                .send({
                    patientId: 'patient-123',
                    doctorId: 'doctor-456',
                    items: [{
                        drugId,
                        dosage: '500mg',
                        frequency: 'TID',
                        duration: '7 days',
                        quantity: 21
                    }]
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(prescriptionResponse.status).toBe(201);
            const prescription = prescriptionResponse.body;
            expect(prescription.status).toBe('DRAFT');

            // 2. Verify prescription
            const verifyResponse = await request(app)
                .post(`/api/v1/prescriptions/${prescription.id}/verify`)
                .send({ userId: 'pharmacist-123' })
                .set('Authorization', `Bearer ${authToken}`);

            expect(verifyResponse.status).toBe(200);
            expect(verifyResponse.body.status).toBe('VERIFIED');

            // 3. Activate prescription
            const activateResponse = await request(app)
                .post(`/api/v1/prescriptions/${prescription.id}/activate`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(activateResponse.status).toBe(200);
            expect(activateResponse.body.status).toBe('ACTIVE');
            expect(activateResponse.body.canBeDispensed).toBe(true);

            // 4. Create sale from prescription
            const saleResponse = await request(app)
                .post('/api/v1/sales/from-prescription')
                .send({
                    prescriptionId: prescription.id,
                    storeId,
                    payments: [{
                        method: 'CASH',
                        amount: 105 // Calculated
                    }]
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(saleResponse.status).toBe(201);
            expect(saleResponse.body.prescriptionId).toBe(prescription.id);
            expect(saleResponse.body.items).toHaveLength(1);
            expect(saleResponse.body.items[0]).toHaveProperty('dosage');
        });
    });

    describe('GRN to Sale Workflow', () => {
        test('should complete GRN receipt and subsequent sale', async () => {
            // 1. Create GRN
            const grnResponse = await request(app)
                .post('/api/v1/grn')
                .send({
                    poId: 'po-123',
                    storeId,
                    items: [{
                        drugId,
                        batchNumber: 'B-NEW-001',
                        receivedQty: 100,
                        freeQty: 10,
                        unitPrice: 5,
                        mrp: 10,
                        expiryDate: '2025-12-31'
                    }]
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(grnResponse.status).toBe(201);
            const grn = grnResponse.body;

            // 2. Complete GRN
            const completeResponse = await request(app)
                .post(`/api/v1/grn/${grn.id}/complete`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(completeResponse.status).toBe(200);
            expect(completeResponse.body.status).toBe('COMPLETED');

            // 3. Verify batch created
            const batchesResponse = await request(app)
                .get('/api/v1/inventory/batches')
                .query({ drugId, batchNumber: 'B-NEW-001' })
                .set('Authorization', `Bearer ${authToken}`);

            expect(batchesResponse.body.length).toBeGreaterThan(0);
            const newBatch = batchesResponse.body[0];
            expect(newBatch.quantity.value).toBe(110); // 100 + 10 free

            // 4. Sell from new batch
            const sale Response = await request(app)
                .post('/api/v1/sales/quick')
                .send({
                    storeId,
                    items: [{
                        drugId,
                        batchId: newBatch.id,
                        quantity: 10,
                        price: newBatch.sellingPrice.amount,
                        gstRate: 12
                    }],
                    payments: [{ method: 'CASH', amount: 112 }]
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(saleResponse.status).toBe(201);

            // 5. Verify stock reduced
            const updatedBatch = await request(app)
                .get(`/api/v1/inventory/batches/${newBatch.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(updatedBatch.body.quantity.value).toBe(100);
        });
    });
});

describe('E2E: Domain Events', () => {
    test('should emit and handle domain events', async () => {
        // Test that domain events are properly emitted and handled
        // This would require event listener mocks or test event bus
    });
});

describe('E2E: Error Scenarios', () => {
    test('should handle insufficient stock gracefully', async () => {
        const response = await request(app)
            .post('/api/v1/sales/quick')
            .send({
                storeId: 'store1',
                items: [{
                    drugId: 'drug1',
                    batchId: 'batch1',
                    quantity: 1000000, // More than available
                    price: 10,
                    gstRate: 12
                }],
                payments: [{ method: 'CASH', amount: 1000 }]
            })
            .set('Authorization', `Bearer token`);

        expect(response.status).toBe(400);
        expect(response.body.error.type).toBe('InsufficientStockError');
    });

    test('should reject expired batch transactions', async () => {
        // Test selling from expired batch
        const response = await request(app)
            .post('/api/v1/inventory/batches/expired-batch-id/deduct')
            .send({ quantity: 10, reason: 'Sale' })
            .set('Authorization', `Bearer token`);

        expect(response.status).toBe(400);
        expect(response.body.error.type).toBe('ExpiredBatchError');
    });

    test('should reject invalid state transitions', async () => {
        // Try to activate prescription without verification
        const response = await request(app)
            .post('/api/v1/prescriptions/draft-rx-id/activate')
            .set('Authorization', `Bearer token`);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid state transition');
    });
});
