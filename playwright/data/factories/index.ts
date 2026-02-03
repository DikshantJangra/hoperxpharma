/**
 * Data Factories
 * 
 * Generate test data for common entities
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Generate unique test identifier
 */
function testId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * User Factory
 */
export async function createTestUser(
    db: PrismaClient,
    overrides: Partial<{
        email: string;
        phoneNumber: string;
        firstName: string;
        lastName: string;
        role: 'ADMIN' | 'PHARMACIST' | 'TECHNICIAN' | 'CASHIER';
        password: string;
    }> = {}
): Promise<{ id: string; email: string }> {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(overrides.password || 'Test@12345', 10);

    const user = await db.user.create({
        data: {
            email: overrides.email || `${testId()}@automation.com`,
            phoneNumber: overrides.phoneNumber || `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
            firstName: overrides.firstName || 'Test',
            lastName: overrides.lastName || 'User',
            role: overrides.role || 'ADMIN',
            passwordHash,
            isActive: true,
        },
    });

    return { id: user.id, email: user.email };
}

/**
 * Store Factory
 */
export async function createTestStore(
    db: PrismaClient,
    ownerId: string,
    overrides: Partial<{
        name: string;
        email: string;
        city: string;
        state: string;
    }> = {}
): Promise<{ id: string; name: string }> {
    const store = await db.store.create({
        data: {
            name: overrides.name || `Test Pharmacy ${testId()}`,
            displayName: overrides.name || `Test Pharmacy ${testId()}`,
            email: overrides.email || `${testId()}@pharmacy.test`,
            phoneNumber: `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
            addressLine1: '123 Test Street',
            city: overrides.city || 'Mumbai',
            state: overrides.state || 'Maharashtra',
            pinCode: '400001',
            isDemo: false,
        },
    });

    // Link owner to store
    await db.storeUser.create({
        data: {
            userId: ownerId,
            storeId: store.id,
            isPrimary: true,
        },
    });

    return { id: store.id, name: store.name };
}

/**
 * Patient Factory
 */
export async function createTestPatient(
    db: PrismaClient,
    storeId: string,
    overrides: Partial<{
        firstName: string;
        lastName: string;
        phoneNumber: string;
        allergies: string[];
        chronicConditions: string[];
    }> = {}
): Promise<{ id: string; firstName: string; lastName: string }> {
    const patient = await db.patient.create({
        data: {
            storeId,
            firstName: overrides.firstName || 'Test',
            lastName: overrides.lastName || `Patient-${testId().substring(0, 8)}`,
            phoneNumber: overrides.phoneNumber || `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
            allergies: overrides.allergies || [],
            chronicConditions: overrides.chronicConditions || [],
        },
    });

    return { id: patient.id, firstName: patient.firstName, lastName: patient.lastName };
}

/**
 * Drug Factory
 */
export async function createTestDrug(
    db: PrismaClient,
    storeId: string,
    overrides: Partial<{
        name: string;
        genericName: string;
        strength: string;
        form: string;
        requiresPrescription: boolean;
        gstRate: number;
    }> = {}
): Promise<{ id: string; name: string }> {
    const drug = await db.drug.create({
        data: {
            storeId,
            name: overrides.name || `Test Drug ${testId().substring(0, 8)}`,
            genericName: overrides.genericName || 'Paracetamol',
            strength: overrides.strength || '500mg',
            form: overrides.form || 'Tablet',
            requiresPrescription: overrides.requiresPrescription ?? false,
            gstRate: overrides.gstRate ?? 12,
            hsnCode: '30049099',
        },
    });

    return { id: drug.id, name: drug.name };
}

/**
 * Inventory Batch Factory
 */
export async function createTestBatch(
    db: PrismaClient,
    storeId: string,
    drugId: string,
    overrides: Partial<{
        batchNumber: string;
        quantity: number;
        mrp: number;
        purchasePrice: number;
        expiryDate: Date;
    }> = {}
): Promise<{ id: string; quantity: number }> {
    const batch = await db.inventoryBatch.create({
        data: {
            storeId,
            drugId,
            batchNumber: overrides.batchNumber || `BATCH-${testId().substring(0, 8)}`,
            baseUnitQuantity: overrides.quantity ?? 100,
            mrp: overrides.mrp ?? 25.00,
            purchasePrice: overrides.purchasePrice ?? 20.00,
            expiryDate: overrides.expiryDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
    });

    return { id: batch.id, quantity: Number(batch.baseUnitQuantity) };
}

/**
 * Supplier Factory
 */
export async function createTestSupplier(
    db: PrismaClient,
    storeId: string,
    overrides: Partial<{
        name: string;
        contactName: string;
        phone: string;
        email: string;
        gstin: string;
    }> = {}
): Promise<{ id: string; name: string }> {
    const supplier = await db.supplier.create({
        data: {
            store: { connect: { id: storeId } },
            name: overrides.name || `Test Supplier ${testId().substring(0, 8)}`,
            category: 'Distributor',
            status: 'Active',
            contactName: overrides.contactName || 'Test Contact',
            phoneNumber: overrides.phone || `+919${Math.floor(100000000 + Math.random() * 900000000)}`,
            email: overrides.email || `${testId()}@supplier.test`,
            gstin: overrides.gstin || '29ABCDE1234F1Z5',
            addressLine1: '456 Supplier Street',
            city: 'Delhi',
            state: 'Delhi',
            pinCode: '110001',
        },
    });

    return { id: supplier.id, name: supplier.name };
}

/**
 * Create complete test data set
 */
export async function createCompleteTestData(
    db: PrismaClient
): Promise<{
    user: { id: string; email: string };
    store: { id: string; name: string };
    patient: { id: string; firstName: string; lastName: string };
    drug: { id: string; name: string };
    batch: { id: string; quantity: number };
    supplier: { id: string; name: string };
}> {
    const user = await createTestUser(db);
    const store = await createTestStore(db, user.id);
    const patient = await createTestPatient(db, store.id);
    const drug = await createTestDrug(db, store.id);
    const batch = await createTestBatch(db, store.id, drug.id);
    const supplier = await createTestSupplier(db, store.id);

    return { user, store, patient, drug, batch, supplier };
}
