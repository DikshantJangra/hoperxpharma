/**
 * Test Script: Verify Negative Stock Prevention
 * 
 * This script tests all scenarios where inventory quantities could go negative
 * and verifies that the system properly blocks such operations.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import services
const saleRepository = require('./src/repositories/saleRepository');
const inventoryRepository = require('./src/repositories/inventoryRepository');
const inventoryService = require('./src/services/inventory/inventoryService');

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let testResults = {
    passed: 0,
    failed: 0,
    total: 0
};

function logTest(name, passed, message) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`${GREEN}✓ PASS${RESET}: ${name}`);
        if (message) console.log(`  ${message}`);
    } else {
        testResults.failed++;
        console.log(`${RED}✗ FAIL${RESET}: ${name}`);
        if (message) console.log(`  ${message}`);
    }
}

async function cleanup() {
    console.log(`\n${BLUE}Cleaning up test data...${RESET}`);

    // Delete test data (use raw queries to bypass validation)
    await prisma.$executeRaw`DELETE FROM "SaleItem" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "invoiceNumber" LIKE 'TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "PaymentSplit" WHERE "saleId" IN (SELECT id FROM "Sale" WHERE "invoiceNumber" LIKE 'TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "Sale" WHERE "invoiceNumber" LIKE 'TEST-%'`;
    await prisma.$executeRaw`DELETE FROM "StockMovement" WHERE "batchId" IN (SELECT id FROM "InventoryBatch" WHERE "batchNumber" LIKE 'TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "InventoryBatch" WHERE "batchNumber" LIKE 'TEST-%'`;
    await prisma.$executeRaw`DELETE FROM "Drug" WHERE "name" LIKE 'TEST_%'`;

    console.log(`${GREEN}Cleanup complete${RESET}\n`);
}

async function createTestDrug(storeId, quantity = 10) {
    const drug = await prisma.drug.create({
        data: {
            name: `TEST_Drug_${Date.now()}`,
            strength: '500mg',
            form: 'TABLET',
            storeId,
            gstRate: 12
        }
    });

    const batch = await prisma.inventoryBatch.create({
        data: {
            drugId: drug.id,
            storeId,
            batchNumber: `TEST-BATCH-${Date.now()}`,
            quantityInStock: quantity,
            expiryDate: new Date('2026-12-31'),
            mrp: 100,
            purchasePrice: 75
        }
    });

    return { drug, batch };
}

async function test1_SaleWithInsufficientStock(storeId, userId) {
    console.log(`\n${BLUE}═══════════════════════════════════════════════${RESET}`);
    console.log(`${YELLOW}Test 1: Sale Creation with Insufficient Stock${RESET}`);
    console.log(`${BLUE}═══════════════════════════════════════════════${RESET}`);

    const { drug, batch } = await createTestDrug(storeId, 5);
    console.log(`Created test drug: ${drug.name} with 5 units in stock`);

    try {
        // Try to sell 10 units when only 5 are available
        await saleRepository.createSale(
            {
                storeId,
                invoiceNumber: `TEST-${Date.now()}`,
                invoiceType: 'REGULAR',
                total: 1000,
                subtotal: 1000,
                taxAmount: 0,
                discountAmount: 0
            },
            [
                {
                    drugId: drug.id,
                    batchId: batch.id,
                    quantity: 10,
                    unitPrice: 100,
                    lineTotal: 1000
                }
            ],
            [
                {
                    paymentMethod: 'CASH',
                    amount: 1000
                }
            ]
        );

        logTest('Sale with insufficient stock should fail', false, 'Sale was created when it should have been blocked');

    } catch (error) {
        const errorOk = error.message.includes('Insufficient stock');
        logTest('Sale with insufficient stock blocked', errorOk, `Error: ${error.message}`);

        // Verify inventory unchanged
        const updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Inventory quantity unchanged after failed sale', updatedBatch.quantityInStock === 5,
            `Expected 5, got ${updatedBatch.quantityInStock}`);
    }
}

async function test2_StockAdjustmentToNegative(storeId) {
    console.log(`\n${BLUE}═══════════════════════════════════════════════${RESET}`);
    console.log(`${YELLOW}Test 2: Stock Adjustment Resulting in Negative${RESET}`);
    console.log(`${BLUE}═══════════════════════════════════════════════${RESET}`);

    const { drug, batch } = await createTestDrug(storeId, 5);
    console.log(`Created test drug: ${drug.name} with 5 units in stock`);

    try {
        // Try to adjust by -10 when only 5 exist
        await inventoryService.adjustStock({
            batchId: batch.id,
            quantityAdjusted: -10,
            reason: 'Test adjustment',
            userId: 'test-user'
        });

        logTest('Negative stock adjustment should fail', false, 'Adjustment was allowed when it should have been blocked');

    } catch (error) {
        const errorOk = error.message.includes('negative stock');
        logTest('Negative stock adjustment blocked', errorOk, `Error: ${error.message}`);

        // Verify inventory unchanged
        const updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Inventory quantity unchanged after failed adjustment', updatedBatch.quantityInStock === 5,
            `Expected 5, got ${updatedBatch.quantityInStock}`);
    }
}

async function test3_DirectBatchUpdateToNegative(storeId) {
    console.log(`\n${BLUE}═══════════════════════════════════════════════${RESET}`);
    console.log(`${YELLOW}Test 3: Direct Batch Update to Negative Quantity${RESET}`);
    console.log(`${BLUE}═══════════════════════════════════════════════${RESET}`);

    const { drug, batch } = await createTestDrug(storeId, 5);
    console.log(`Created test drug: ${drug.name} with 5 units in stock`);

    try {
        // Try to directly update to negative quantity
        await inventoryRepository.updateBatchQuantity(batch.id, -3);

        logTest('Direct update to negative should fail', false, 'Update was allowed when it should have been blocked');

    } catch (error) {
        const errorOk = error.message.includes('cannot be negative');
        logTest('Direct negative batch update blocked', errorOk, `Error: ${error.message}`);

        // Verify inventory unchanged
        const updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Inventory quantity unchanged after failed update', updatedBatch.quantityInStock === 5,
            `Expected 5, got ${updatedBatch.quantityInStock}`);
    }
}

async function test4_ValidOperations(storeId) {
    console.log(`\n${BLUE}═══════════════════════════════════════════════${RESET}`);
    console.log(`${YELLOW}Test 4: Valid Operations Should Work${RESET}`);
    console.log(`${BLUE}═══════════════════════════════════════════════${RESET}`);

    const { drug, batch } = await createTestDrug(storeId, 10);
    console.log(`Created test drug: ${drug.name} with 10 units in stock`);

    try {
        // Sell 5 units
        await saleRepository.createSale(
            {
                storeId,
                invoiceNumber: `TEST-${Date.now()}`,
                invoiceType: 'REGULAR',
                total: 500,
                subtotal: 500,
                taxAmount: 0,
                discountAmount: 0
            },
            [
                {
                    drugId: drug.id,
                    batchId: batch.id,
                    quantity: 5,
                    unitPrice: 100,
                    lineTotal: 500
                }
            ],
            [
                {
                    paymentMethod: 'CASH',
                    amount: 500
                }
            ]
        );

        let updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Sale of 5 units successful', updatedBatch.quantityInStock === 5,
            `Expected 5, got ${updatedBatch.quantityInStock}`);

        // Adjust by -3
        await inventoryService.adjustStock({
            batchId: batch.id,
            quantityAdjusted: -3,
            reason: 'Test adjustment',
            userId: 'test-user'
        });

        updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Adjustment of -3 units successful', updatedBatch.quantityInStock === 2,
            `Expected 2, got ${updatedBatch.quantityInStock}`);

        // Update directly to 0 (should be allowed)
        await inventoryRepository.updateBatchQuantity(batch.id, 0);

        updatedBatch = await prisma.inventoryBatch.findUnique({
            where: { id: batch.id }
        });

        logTest('Update to 0 units successful', updatedBatch.quantityInStock === 0,
            `Expected 0, got ${updatedBatch.quantityInStock}`);

    } catch (error) {
        logTest('Valid operations should work', false, `Unexpected error: ${error.message}`);
    }
}

async function runTests() {
    console.log(`\n${BLUE}${'═'.repeat(50)}${RESET}`);
    console.log(`${BLUE}  NEGATIVE INVENTORY PREVENTION TEST SUITE${RESET}`);
    console.log(`${BLUE}${'═'.repeat(50)}${RESET}\n`);

    try {
        // Clean up before tests
        await cleanup();

        // Get a test store
        const store = await prisma.store.findFirst();
        if (!store) {
            console.log(`${RED}No store found. Please create a store first.${RESET}`);
            return;
        }

        console.log(`${GREEN}Using store: ${store.name} (${store.id})${RESET}`);

        // Run all tests
        await test1_SaleWithInsufficientStock(store.id, 'test-user');
        await test2_StockAdjustmentToNegative(store.id);
        await test3_DirectBatchUpdateToNegative(store.id);
        await test4_ValidOperations(store.id);

        // Clean up after tests
        await cleanup();

        // Print summary
        console.log(`\n${BLUE}${'═'.repeat(50)}${RESET}`);
        console.log(`${BLUE}  TEST SUMMARY${RESET}`);
        console.log(`${BLUE}${'═'.repeat(50)}${RESET}`);
        console.log(`Total Tests: ${testResults.total}`);
        console.log(`${GREEN}Passed: ${testResults.passed}${RESET}`);
        console.log(`${RED}Failed: ${testResults.failed}${RESET}`);

        if (testResults.failed === 0) {
            console.log(`\n${GREEN}✓ All tests passed!${RESET}\n`);
        } else {
            console.log(`\n${RED}✗ Some tests failed!${RESET}\n`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`${RED}Test suite error:${RESET}`, error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run tests
runTests();
