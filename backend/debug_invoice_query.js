
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugInvoiceQuery() {
    try {
        const storeId = 'cmiudrdtm002bbg2b32g7jd0o'; // Dikshant's Store
        const startDateStr = '2025-12-01'; // Start of month
        const endDateStr = '2025-12-09';   // Today
        const status = 'not_invoiced';

        console.log(`--- Debugging Invoice Query ---`);
        console.log(`Store: ${storeId}`);
        console.log(`Date Range: ${startDateStr} to ${endDateStr}`);
        console.log(`Status Filter: ${status}`);

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        console.log(`Parsed Start: ${startDate.toISOString()}`);
        console.log(`Parsed End: ${endDate.toISOString()}`);

        const where = {
            storeId,
            status: 'COMPLETED',
            receivedDate: {
                gte: startDate,
                lte: endDate
            }
        };

        if (status === 'not_invoiced') {
            where.ConsolidatedInvoiceGRN = {
                none: {}
            };
        }

        console.log('\nQuery "where" clause:', JSON.stringify(where, null, 2));

        const grns = await prisma.goodsReceivedNote.findMany({
            where,
            include: {
                supplier: true,
                ConsolidatedInvoiceGRN: true // Debugging: verify relations
            }
        });

        console.log(`\nFound ${grns.length} GRNs.`);

        if (grns.length === 0) {
            console.log('\n--- Checking why ---');
            // Check without date filter
            const allCompleted = await prisma.goodsReceivedNote.findMany({
                where: { storeId, status: 'COMPLETED' }
            });
            console.log(`Total Completed GRNs (no date/invoice filter): ${allCompleted.length}`);
            allCompleted.forEach(g => {
                console.log(`  - GRN: ${g.grnNumber}, Date: ${g.receivedDate.toISOString()}`);
            });
        } else {
            grns.forEach(g => {
                console.log(`  - MATCH: ${g.grnNumber}, Date: ${g.receivedDate.toISOString()}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugInvoiceQuery();
