const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGRNItems() {
    const grn = await prisma.goodsReceivedNote.findFirst({
        where: {
            items: {
                some: {
                    isSplit: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, grnNumber: true }
    });

    if (!grn) {
        console.log('No GRN with split items found');
        await prisma.$disconnect();
        return;
    }

    console.log('Checking GRN:', grn.grnNumber, '(', grn.id, ')');

    const items = await prisma.gRNItem.findMany({
        where: { grnId: grn.id },
        select: {
            id: true,
            batchNumber: true,
            parentItemId: true,
            isSplit: true,
            receivedQty: true
        },
        orderBy: { id: 'asc' }
    });

    console.log('\n=== ALL GRN ITEMS ===');
    console.log(JSON.stringify(items, null, 2));

    console.log('\n=== PARENT ITEMS (parentItemId = null) ===');
    const parents = items.filter(i => i.parentItemId === null);
    console.log(JSON.stringify(parents, null, 2));

    console.log('\n=== CHILD ITEMS (parentItemId != null) ===');
    const children = items.filter(i => i.parentItemId !== null);
    console.log(JSON.stringify(children, null, 2));

    await prisma.$disconnect();
}

checkGRNItems().catch(console.error);
