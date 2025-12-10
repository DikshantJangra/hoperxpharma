const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findGRN() {
    try {
        const grn = await prisma.goodsReceivedNote.findFirst({
            where: {
                grnNumber: 'GRN2025128869'
            },
            include: {
                items: {
                    where: { parentItemId: null },
                    include: { children: true }
                }
            }
        });

        if (!grn) {
            console.log('GRN not found');
            return;
        }

        console.log('\n=== GRN ===');
        console.log('Status:', grn.status);
        console.log('Items:', grn.items.length);

        grn.items.forEach(item => {
            console.log(`\nBatch: ${item.batchNumber}`);
            console.log(`  isSplit: ${item.isSplit}`);
            console.log(`  receivedQty: ${item.receivedQty}`);
            console.log(`  freeQty: ${item.freeQty}`);
            console.log(`  children: ${item.children?.length || 0}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findGRN();
