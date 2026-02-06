
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const gstEventBus = require('../src/lib/gst/GSTEventBus');
const { GSTEventType } = require('../src/lib/gst/GSTEngine');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Testing GST Event Pipeline...');

    // 1. Get a store
    const store = await prisma.store.findFirst();
    if (!store) {
        console.error('❌ No store found. Cannot run test.');
        return;
    }
    console.log(`Using Store: ${store.id} (${store.name}) in ${store.state}`);

    // 2. Simulate Sale Event
    const saleId = `test-sale-${Date.now()}`;
    const eventPayload = {
        eventId: saleId,
        storeId: store.id,
        date: new Date(),
        eventType: GSTEventType.SALE,
        customerState: store.state, // Intra-state
        items: [
            {
                itemId: 'item-1',
                hsnCode: '3004',
                taxableValue: 100,
                quantity: 1,
                discountAmount: 0
            }
        ]
    };

    console.log('📡 Emitting SALE_CREATED event...', saleId);
    gstEventBus.emitEvent(GSTEventType.SALE, eventPayload);

    // 3. Wait for Async Processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Verify Ledger Entry
    const entries = await prisma.gSTLedgerEntry.findMany({
        where: { eventId: saleId }
    });

    if (entries.length > 0) {
        console.log('✅ GST Ledger Entries found:', entries.length);
        console.log(entries[0]);

        // Clean up
        console.log('🧹 Cleaning up test data...');
        await prisma.gSTLedgerEntry.deleteMany({ where: { eventId: saleId } });
        console.log('✨ Test Passed!');
    } else {
        console.error('❌ No ledger entries found. Pipeline failed.');
    }

    // 5. Simulate Purchase Event (ITC)
    const purchaseId = `test-purchase-${Date.now()}`;
    const purchasePayload = {
        eventId: purchaseId,
        storeId: store.id,
        date: new Date(),
        eventType: GSTEventType.PURCHASE,
        supplierState: store.state, // Intra-state purchase
        items: [
            {
                itemId: 'item-2',
                hsnCode: '3004',
                taxableValue: 500,
                eligibility: 'ELIGIBLE'
            }
        ]
    };

    console.log('📡 Emitting PURCHASE_INWARDED event...', purchaseId);
    gstEventBus.emitEvent(GSTEventType.PURCHASE, purchasePayload);

    // 6. Wait for Async Processing
    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Verify Ledger Entry
    const purchaseEntries = await prisma.gSTLedgerEntry.findMany({
        where: { eventId: purchaseId }
    });

    if (purchaseEntries.length > 0) {
        console.log('✅ GST Purchase Ledger Entries found:', purchaseEntries.length);
        console.log(purchaseEntries[0]);

        // Clean up
        console.log('🧹 Cleaning up test data...');
        await prisma.gSTLedgerEntry.deleteMany({ where: { eventId: saleId } });
        await prisma.gSTLedgerEntry.deleteMany({ where: { eventId: purchaseId } });
        console.log('✨ Test Passed!');
    } else {
        console.error('❌ No purchase ledger entries found. Pipeline failed.');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
