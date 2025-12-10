const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GRNRepository = require('./src/repositories/grnRepository');
const GRNService = require('./src/services/grn/grnService');

// Mock logger to avoid errors
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

async function testDraftSaveAndDiscard() {
    console.log('--- Starting Draft Save & Discard Test ---');
    let grnId = null;
    let poId = null;

    try {
        // 1. Setup Data
        const supplier = await prisma.supplier.findFirst();
        const store = await prisma.store.findFirst();
        const user = await prisma.user.findFirst();

        if (!supplier || !store || !user) throw new Error('Missing seed data');

        const po = await prisma.purchaseOrder.create({
            data: {
                poNumber: `TEST-PO-${Date.now()}`,
                supplierId: supplier.id,
                storeId: store.id,
                createdBy: user.id,
                status: 'SENT',
                total: 100,
                subtotal: 100,
                taxAmount: 0
            }
        });
        poId = po.id;
        console.log(`PO Created: ${po.poNumber}`);

        // 2. Create GRN (Simulate initializeGRN)
        const grn = await prisma.goodsReceivedNote.create({
            data: {
                grnNumber: `TEST-GRN-${Date.now()}`,
                poId: po.id,
                storeId: store.id,
                supplierId: supplier.id,
                receivedBy: user.id,
                status: 'DRAFT',
                total: 0,
                subtotal: 0,
                taxAmount: 0
            }
        });
        grnId = grn.id;
        console.log(`GRN Created: ${grn.grnNumber}`);

        // 3. Test Save Draft (Update)
        console.log('--- Testing Save Draft ---');
        const grnRepository = require('./src/repositories/grnRepository');
        const grnService = require('./src/services/grn/grnService');

        const updates = {
            notes: 'Verified Save Logic',
            supplierInvoiceNo: 'TEST-INV-999'
        };

        await grnService.updateGRN({
            grnId: grn.id,
            updates: updates,
            userId: user.id
        });

        // Verify update in DB
        const updatedGrn = await prisma.goodsReceivedNote.findUnique({ where: { id: grn.id } });
        if (updatedGrn.notes === 'Verified Save Logic' && updatedGrn.supplierInvoiceNo === 'TEST-INV-999') {
            console.log('✅ PASS: Draft data saved successfully to DB.');
        } else {
            console.error('❌ FAIL: Draft data NOT saved correctly.');
            console.log('Actual Data:', updatedGrn);
        }

        // 4. Test Discard Draft (Hard Delete)
        console.log('--- Testing Discard Draft (Hard Delete) ---');
        // We use cancelGRN which calls deleteGRN for drafts
        await grnService.cancelGRN({
            grnId: grn.id,
            userId: user.id
        });

        // Verify deletion
        const deletedGrn = await prisma.goodsReceivedNote.findUnique({ where: { id: grn.id } });
        if (!deletedGrn) {
            console.log('✅ PASS: GRN completely removed from database (Hard Delete).');
        } else {
            console.error('❌ FAIL: GRN still exists in database!');
            console.log('Status:', deletedGrn.status);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // Cleanup PO if exists
        if (poId) {
            try {
                await prisma.purchaseOrder.delete({ where: { id: poId } });
                console.log('Cleanup: PO deleted.');
            } catch (e) {
                // Ignore if already deleted cascade
            }
        }
        await prisma.$disconnect();
    }
}

testDraftSaveAndDiscard();
