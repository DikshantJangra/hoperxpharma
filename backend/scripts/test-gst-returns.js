
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const gstEventBus = require('../src/lib/gst/GSTEventBus');
const { GSTEventType } = require('../src/lib/gst/GSTEngine');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Testing GST Return Logic...');

    const store = await prisma.store.findFirst();
    if (!store) { console.error('No Store'); return; }

    const returnId = `test-return-${Date.now()}`;
    const returnPayload = {
        eventId: returnId, // Credit Note Number
        storeId: store.id,
        date: new Date(),
        eventType: GSTEventType.SALE_RETURN,
        customerState: store.state,
        items: [
            {
                itemId: 'item-return-1',
                hsnCode: '3004',
                taxableValue: 100, // Returning 100rs worth of goods
            }
        ]
    };

    console.log('📡 Emitting SALE_RETURN event...', returnId);
    gstEventBus.emitEvent(GSTEventType.SALE_RETURN, returnPayload);

    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const entries = await prisma.gSTLedgerEntry.findMany({
        where: { eventId: returnId }
    });

    if (entries.length > 0) {
        console.log('✅ GST Return Ledger Entries found:', entries.length);
        console.log(entries[0]);
        console.log('Event Type:', entries[0].eventType); // Should be SALE_RETURN

        await prisma.gSTLedgerEntry.deleteMany({ where: { eventId: returnId } });
        console.log('✨ Test Passed!');
    } else {
        console.error('❌ No entries found.');
    }
}

main()
    .catch(console.error)
    .finally(async () => { await prisma.$disconnect(); });
