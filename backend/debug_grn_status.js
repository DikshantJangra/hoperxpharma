const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGRN() {
    try {
        const grnId = 'cmj0ahrlw000b145hgb4jlmht';
        const grn = await prisma.goodsReceivedNote.findUnique({
            where: { id: grnId }
        });

        if (!grn) {
            console.log('GRN not found');
        } else {
            console.log('GRN Found:');
            console.log('ID:', grn.id);
            console.log('Number:', grn.grnNumber);
            console.log('Status:', grn.status);
            console.log('Created At:', grn.createdAt);
            console.log('Updated At:', grn.updatedAt);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGRN();
