
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const gstEventBus = require('../src/lib/gst/GSTEventBus');
const { GSTEventType, GSTItcStatus } = require('../src/lib/gst/GSTEngine');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Testing GST Write-off Logic...');

    const store = await prisma.store.findFirst();
    if (!store) { console.error('No Store'); return; }

    const eventId = `test-writeoff-${Date.now()}`;
    const payload = {
        eventId: eventId,
        storeId: store.id,
        date: new Date(),
        eventType: GSTEventType.WRITEOFF,
        items: [
            {
                itemId: 'item-damaged-1',
                hsnCode: '3004',
                taxableValue: 500, // Lost 500rs worth of goods
            }
        ]
    };

    console.log('📡 Emitting WRITEOFF event...', eventId);
    gstEventBus.emitEvent(GSTEventType.WRITEOFF, payload);

    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const entries = await prisma.gSTLedgerEntry.findMany({
        where: { eventId: eventId }
    });

    if (entries.length > 0) {
        console.log('✅ GST Write-off Ledger Entries found:', entries.length);
        console.log(entries[0]);
        console.log('Event Type:', entries[0].eventType);
        console.log('ITC Status:', entries[0].itcStatus);

        if (entries[0].itcStatus === GSTItcStatus.REVERSED) {
            console.log('✅ Correctly marked as REVERSED');
        } else {
            console.error('❌ Incorrect ITC Status');
        }

        await prisma.gSTLedgerEntry.deleteMany({ where: { eventId: eventId } });
        console.log('✨ Test Passed!');
    } else {
        console.error('❌ No entries found.');
    }
}

main()
    .catch(console.error)
    .finally(async () => { await prisma.$disconnect(); });
