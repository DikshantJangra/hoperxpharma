const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    console.log('Testing direct DB update...');

    // 1. Get a recent GRN item
    const item = await prisma.gRNItem.findFirst({
        orderBy: { id: 'desc' } // Get absolutely latest item
    });

    if (!item) {
        console.log('No GRN items found to test.');
        return;
    }

    console.log(`Found item: ${item.id}, Current Barcode: ${item.manufacturerBarcode}`);

    // 2. Try to update it
    try {
        const updated = await prisma.gRNItem.update({
            where: { id: item.id },
            data: { manufacturerBarcode: 'TEST_BARCODE_123' }
        });
        console.log('Update successful!');
        console.log('New Barcode:', updated.manufacturerBarcode);

        // 3. Revert it (optional, or leave it for verify)
        // await prisma.gRNItem.update({
        //     where: { id: item.id },
        //     data: { manufacturerBarcode: item.manufacturerBarcode }
        // });
    } catch (e) {
        console.error('Update failed:', e.message);
    }
}

testUpdate()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
