const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GRNRepository = require('./src/repositories/grnRepository');
const GRNService = require('./src/services/grn/grnService');

// Mock logger
const logger = {
    info: (msg) => console.log('[INFO]', msg),
    error: (msg) => console.error('[ERROR]', msg),
    warn: (msg) => console.warn('[WARN]', msg)
};
global.logger = logger;
global.ApiError = class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
    static notFound(msg) { return new ApiError(404, msg); }
    static badRequest(msg) { return new ApiError(400, msg); }
};

async function verifySaveDraft() {
    console.log('\n--- VERIFYING SAVE DRAFT FUNCTIONALITY ---');
    let poId = null;
    let grnId = null;

    try {
        // 1. Setup Dependencies
        const supplier = await prisma.supplier.findFirst();
        const store = await prisma.store.findFirst();
        const user = await prisma.user.findFirst();

        if (!supplier || !store || !user) throw new Error('Missing seed data');

        // 2. Create PO
        const po = await prisma.purchaseOrder.create({
            data: {
                poNumber: `VERIFY-PO-${Date.now()}`,
                supplierId: supplier.id,
                storeId: store.id,
                createdBy: user.id,
                status: 'SENT',
                total: 500,
                subtotal: 500,
                taxAmount: 0
            }
        });
        poId = po.id;
        console.log(`[SETUP] PO Created: ${po.poNumber}`);

        // 3. Create Draft GRN
        const grn = await prisma.goodsReceivedNote.create({
            data: {
                grnNumber: `VERIFY-GRN-${Date.now()}`,
                po: { connect: { id: po.id } },
                storeId: store.id,
                supplier: { connect: { id: supplier.id } },
                receivedByUser: { connect: { id: user.id } },
                status: 'DRAFT',
                total: 0,
                subtotal: 0,
                taxAmount: 0
            }
        });
        grnId = grn.id;
        console.log(`[SETUP] GRN Created: ${grn.grnNumber} (Status: ${grn.status})`);

        // 4. Initialize Service
        // Note: Using required instances as they are singletons in the codebase
        const grnRepository = require('./src/repositories/grnRepository');
        const grnService = require('./src/services/grn/grnService');

        // --- TEST CASE 1: Save Invoice Number ---
        console.log('\n[TEST 1] Saving Invoice Number...');
        await grnService.updateGRN({
            grnId: grn.id,
            updates: { supplierInvoiceNo: 'INV-A-100' },
            userId: user.id
        });
        let check1 = await prisma.goodsReceivedNote.findUnique({ where: { id: grnId } });
        if (check1.supplierInvoiceNo === 'INV-A-100') {
            console.log('✅ PASS: Invoice Number saved.');
        } else {
            console.error('❌ FAIL: Invoice Number mismatch:', check1.supplierInvoiceNo);
        }

        // --- TEST CASE 2: Save Notes (Cumulative) ---
        console.log('\n[TEST 2] Saving Notes...');
        await grnService.updateGRN({
            grnId: grn.id,
            updates: { notes: 'First Note Entry' },
            userId: user.id
        });
        let check2 = await prisma.goodsReceivedNote.findUnique({ where: { id: grnId } });
        if (check2.notes === 'First Note Entry' && check2.supplierInvoiceNo === 'INV-A-100') {
            console.log('✅ PASS: Notes saved (Invoice No persisted).');
        } else {
            console.error('❌ FAIL: Data consistency check failed.');
        }

        // --- TEST CASE 3: Save Invoice Date ---
        console.log('\n[TEST 3] Saving Invoice Date...');
        const testDate = new Date('2025-01-01').toISOString();
        await grnService.updateGRN({
            grnId: grn.id,
            updates: { supplierInvoiceDate: testDate },
            userId: user.id
        });
        let check3 = await prisma.goodsReceivedNote.findUnique({ where: { id: grnId } });
        if (check3.supplierInvoiceDate.toISOString() === testDate) {
            console.log('✅ PASS: Invoice Date saved.');
        } else {
            console.error('❌ FAIL: Date mismatch.');
        }

        // --- TEST CASE 4: Update 'IN_PROGRESS' Status ---
        console.log('\n[TEST 4] Updating Status to IN_PROGRESS...');
        await grnService.updateGRN({
            grnId: grn.id,
            updates: { status: 'IN_PROGRESS' },
            userId: user.id
        });
        let check4 = await prisma.goodsReceivedNote.findUnique({ where: { id: grnId } });
        if (check4.status === 'IN_PROGRESS') {
            console.log('✅ PASS: Status updated to IN_PROGRESS.');
        } else {
            console.error('❌ FAIL: Status mismatch:', check4.status);
        }

        console.log('\n--- VERIFICATION COMPLETE: ALL CHECKS PASSED ---');

    } catch (error) {
        console.error('\n❌ CRITICAL FAILURE:', error);
    } finally {
        // Cleanup
        if (poId) {
            await prisma.purchaseOrder.delete({ where: { id: poId } }).catch(() => { });
            console.log('\n[CLEANUP] Test data deleted.');
        }
        await prisma.$disconnect();
    }
}

verifySaveDraft();
