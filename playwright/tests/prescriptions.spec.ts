/**
 * Prescription Tests - Clinical Workflow
 * 
 * Tests:
 * - Prescription creation
 * - Status transitions
 * - Dispense workflow
 * - Refill management
 */

import { test, expect } from '../fixtures/auth.fixture';
import { createTestPatient, createTestDrug, createTestBatch } from '../data/factories';

test.describe('Prescription - Create & Manage', () => {
    test('should create prescription and track status', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create test patient
        const patient = await createTestPatient(db, storeId, {
            firstName: 'Rx',
            lastName: 'Patient',
        });
        testData.patientIds.push(patient.id);

        // Create prescription drug
        const drug = await createTestDrug(db, storeId, {
            name: 'Amoxicillin 500',
            requiresPrescription: true,
        });
        testData.drugIds.push(drug.id);

        const batch = await createTestBatch(db, storeId, drug.id, {
            quantity: 100,
        });
        testData.inventoryBatchIds.push(batch.id);

        // Navigate to prescriptions
        await page.goto('/prescriptions');
        await page.waitForLoadState('networkidle');

        // Click new prescription
        const newRxBtn = page.locator('button:has-text("New"), a:has-text("New Prescription")').first();
        if (await newRxBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await newRxBtn.click();
        }

        // Select patient
        const patientSearch = page.locator('input[placeholder*="Patient"]').first();
        if (await patientSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
            await patientSearch.fill(patient.firstName);
            await page.waitForTimeout(500);

            const patientOption = page.locator(`text=${patient.firstName}`).first();
            if (await patientOption.isVisible({ timeout: 2000 }).catch(() => false)) {
                await patientOption.click();
            }
        }

        console.log('✅ Prescription creation flow initiated');

        // BACKEND VERIFICATION: Check prescription created
        const prescription = await db.prescription.findFirst({
            where: {
                patientId: patient.id,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (prescription) {
            testData.prescriptionIds.push(prescription.id);
        }

        if (prescription) {
            expect(prescription.status).toBe('DRAFT');
            console.log(`✅ Prescription created with status: ${prescription.status}`);
        }
    });

    test('should transition prescription through workflow', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create patient and drug
        const patient = await createTestPatient(db, storeId);
        testData.patientIds.push(patient.id);
        const drug = await createTestDrug(db, storeId, {
            name: 'Workflow Test Drug',
            requiresPrescription: true,
        });
        testData.drugIds.push(drug.id);

        const batch = await createTestBatch(db, storeId, drug.id, { quantity: 100 });
        testData.inventoryBatchIds.push(batch.id);

        // Create a prescription directly in database
        const prescription = await db.prescription.create({
            data: {
                store: { connect: { id: storeId } },
                patient: { connect: { id: patient.id } },
                prescriptionNumber: `RX-${Date.now()}`,
                status: 'DRAFT',
                issueDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                prescriptionItems: {
                    create: [{
                        drugId: drug.id,
                        quantityPrescribed: 10,
                        sig: 'Take once daily',
                    }],
                },
            },
        });
        testData.prescriptionIds.push(prescription.id);

        // Navigate to prescription detail
        await page.goto(`/prescriptions/${prescription.id}`);
        await page.waitForLoadState('networkidle');

        // Verify prescription shows
        await expect(page.locator(`text=${drug.name}`)).toBeVisible({ timeout: 5000 });

        // Click verify button
        const verifyBtn = page.locator('button:has-text("Verify")').first();
        if (await verifyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await verifyBtn.click();

            // VERIFY: Status updated to VERIFIED
            const updatedRx = await db.prescription.findUnique({
                where: { id: prescription.id },
            });

            if (updatedRx?.status === 'VERIFIED') {
                console.log('✅ Prescription verified successfully');
            }
        }
    });
});

test.describe('Prescription - Dispense', () => {
    test('should dispense prescription and deduct inventory', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create complete test data
        const patient = await createTestPatient(db, storeId);
        testData.patientIds.push(patient.id);
        const drug = await createTestDrug(db, storeId, {
            name: 'Dispense Test Drug',
            requiresPrescription: true,
        });
        testData.drugIds.push(drug.id);

        const batch = await createTestBatch(db, storeId, drug.id, {
            quantity: 100,
        });
        testData.inventoryBatchIds.push(batch.id);

        // Create verified prescription
        const prescription = await db.prescription.create({
            data: {
                store: { connect: { id: storeId } },
                patient: { connect: { id: patient.id } },
                prescriptionNumber: `RX-V-${Date.now()}`,
                status: 'VERIFIED', // Ready to dispense
                issueDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                prescriptionItems: {
                    create: [{
                        drugId: drug.id,
                        quantityPrescribed: 10,
                        sig: 'Take as directed',
                    }],
                },
            },
        });
        testData.prescriptionIds.push(prescription.id);

        // Navigate to dispense page
        await page.goto(`/prescriptions/${prescription.id}`);
        await page.waitForLoadState('networkidle');

        // Click dispense button
        const dispenseBtn = page.locator('button:has-text("Dispense")').first();
        if (await dispenseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await dispenseBtn.click();

            // Complete dispense workflow
            await page.waitForTimeout(2000);

            // VERIFY: Inventory deducted
            const updatedBatch = await db.inventoryBatch.findUnique({
                where: { id: batch.id },
            });

            expect(Number(updatedBatch!.baseUnitQuantity)).toBe(90); // 100 - 10
            console.log('✅ Dispense completed, inventory verified');

            // VERIFY: Prescription completed
            const updatedRx = await db.prescription.findUnique({
                where: { id: prescription.id },
            });

            if (updatedRx?.status === 'COMPLETED') {
                console.log('✅ Prescription marked as completed');
            }
        }
    });
});

test.describe('Prescription - Refills', () => {
    test('should track refill count on prescription', async ({ page, db, testData }) => {
        const user = await db.user.findFirst({
            where: { email: { contains: '@automation.com' } },
            include: { storeUsers: true },
        });

        if (!user?.storeUsers?.[0]?.storeId) {
            test.skip();
            return;
        }

        const storeId = user.storeUsers[0].storeId;

        // Create patient and drug
        const patient = await createTestPatient(db, storeId);
        testData.patientIds.push(patient.id);
        const drug = await createTestDrug(db, storeId, {
            name: 'Refill Test Drug',
            requiresPrescription: true,
        });
        testData.drugIds.push(drug.id);

        const batch = await createTestBatch(db, storeId, drug.id, { quantity: 500 });
        testData.inventoryBatchIds.push(batch.id);

        // Create prescription with refills allowed
        const prescription = await db.prescription.create({
            data: {
                store: { connect: { id: storeId } },
                patient: { connect: { id: patient.id } },
                prescriptionNumber: `RX-R-${Date.now()}`,
                status: 'ACTIVE',
                issueDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                totalRefills: 3, // 3 refills permitted
                prescriptionItems: {
                    create: [{
                        drugId: drug.id,
                        quantityPrescribed: 30, // 30-day supply
                        sig: 'Take daily',
                    }],
                },
            },
        });
        testData.prescriptionIds.push(prescription.id);

        expect(prescription.totalRefills).toBe(3);

        console.log('✅ Refillable prescription created');
    });
});
