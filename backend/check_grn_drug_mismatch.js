const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGRNDrugIssue() {
    try {
        // Find the GRN we created
        const grn = await prisma.goodsReceivedNote.findFirst({
            where: { grnNumber: 'GRN2025128869' },
            include: {
                items: {
                    include: {
                        drug: {
                            select: {
                                id: true,
                                name: true,
                                storeId: true,
                                store: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                po: {
                    include: {
                        items: {
                            include: {
                                drug: {
                                    select: {
                                        id: true,
                                        name: true,
                                        storeId: true,
                                        store: {
                                            select: {
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!grn) {
            console.log('GRN not found');
            return;
        }

        console.log('\n=== GRN ===');
        console.log('GRN Store:', grn.storeId);

        console.log('\n=== PO ITEMS ===');
        grn.po.items.forEach(item => {
            console.log(`Drug: ${item.drug.name}`);
            console.log(`  Drug Store: ${item.drug.store.name} (${item.drug.storeId})`);
            console.log(`  PO Store: ${grn.storeId}`);
            console.log(`  MATCH: ${item.drug.storeId === grn.storeId ? '✅' : '❌'}`);
        });

        console.log('\n=== GRN ITEMS ===');
        grn.items.forEach(item => {
            console.log(`Drug: ${item.drug.name}`);
            console.log(`  Drug Store: ${item.drug.store.name} (${item.drug.storeId})`);
            console.log(`  GRN Store: ${grn.storeId}`);
            console.log(`  MATCH: ${item.drug.storeId === grn.storeId ? '✅' : '❌'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGRNDrugIssue();
