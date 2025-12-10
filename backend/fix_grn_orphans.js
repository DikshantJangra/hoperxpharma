// This script fixes existing GRN items where children don't have parentItemId set
// Run this ONCE to fix the data, then delete this file

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGRNItems() {
    console.log('Finding GRN items with isSplit=true...');

    const splitParents = await prisma.gRNItem.findMany({
        where: { isSplit: true },
        include: { children: true }
    });

    console.log(`Found ${splitParents.length} split parent items`);

    for (const parent of splitParents) {
        console.log(`\nParent: ${parent.id} (${parent.batchNumber})`);
        console.log(`  Has ${parent.children.length} children in relation`);

        // Find items that should be children but don't have parentItemId set
        const orphans = await prisma.gRNItem.findMany({
            where: {
                grnId: parent.grnId,
                drugId: parent.drugId,
                id: { not: parent.id },
                parentItemId: null,
                isSplit: false
            }
        });

        console.log(`  Found ${orphans.length} potential orphan items`);

        if (orphans.length > 0 && parent.children.length === 0) {
            console.log(`  Fixing: Setting parentItemId for orphans...`);
            for (const orphan of orphans) {
                await prisma.gRNItem.update({
                    where: { id: orphan.id },
                    data: { parentItemId: parent.id }
                });
                console.log(`    ✓ Updated ${orphan.id} (${orphan.batchNumber})`);
            }
        }
    }

    console.log('\n✅ Done!');
    await prisma.$disconnect();
}

fixGRNItems().catch(console.error);
