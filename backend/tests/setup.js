/**
 * Test Setup
 * Global test configuration and utilities
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Prisma for unit tests
jest.mock('../src/db/prisma', () => ({
    $transaction: jest.fn(),
    $disconnect: jest.fn()
}));

// Global test utilities
global.createMockBatch = (overrides = {}) => ({
    id: 'batch-123',
    batchNumber: 'B001',
    drugId: 'drug-1',
    storeId: 'store-1',
    quantityInStock: 100,
    expiryDate: new Date('2025-12-31'),
    mrp: 10,
    purchasePrice: 5,
    ...overrides
});

global.createMockDrug = (overrides = {}) => ({
    id: 'drug-123',
    storeId: 'store-1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    strength: '500mg',
    form: 'TABLET',
    gstRate: 12,
    schedule: 'OTC',
    isActive: true,
    ...overrides
});

global.createMockSale = (overrides = {}) => ({
    id: 'sale-123',
    invoiceNumber: 'INV-202601-0001',
    storeId: 'store-1',
    status: 'COMPLETED',
    total: 56,
    items: [],
    payments: [],
    ...overrides
});

// Cleanup after all tests
afterAll(async () => {
    const prisma = require('../src/db/prisma');
    await prisma.$disconnect();
});
