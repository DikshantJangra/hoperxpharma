const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGRNCompletion() {
    try {
        // Find a draft GRN
        const grn = await prisma.goodsReceivedNote.findFirst({
            where: { status: 'DRAFT' },
            include: {
                items: {
                    where: { parentItemId: null },
                    include: { children: true }
                }
            }
        });

        if (!grn) {
            console.log('No draft GRN found');
            return;
        }

        console.log('\n=== GRN FOUND ===');
        console.log('GRN Number:', grn.grnNumber);
        console.log('Items count:', grn.items.length);

        console.log('\n=== ITEMS ===');
        grn.items.forEach(item => {
            console.log(`- Batch: ${item.batchNumber}, isSplit: ${item.isSplit}, children: ${item.children?.length || 0}, qty: ${item.receivedQty}`);
        });

        // Flatten items
        const allItems = grn.items.flatMap(item => {
            if (item.isSplit) {
                console.log(`  → Item ${item.batchNumber} is split, using ${item.children?.length || 0} children`);
                return item.children || [];
            }
            console.log(`  → Item ${item.batchNumber} is NOT split, using itself`);
            return [item];
        });

        console.log('\n=== FLATTENED ITEMS ===');
        console.log('Count:', allItems.length);
        allItems.forEach(item => {
            console.log(`- Batch: ${item.batchNumber}, qty: ${item.receivedQty + item.freeQty}`);
        });

        // Check if inventory would be created
        console.log('\n=== INVENTORY CHECK ===');
        for (const item of allItems) {
            const totalQty = item.receivedQty + item.freeQty;
            console.log(`Batch ${item.batchNumber}: totalQty = ${totalQty}, would create inventory: ${totalQty > 0 ? 'YES' : 'NO'}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testGRNCompletion();
