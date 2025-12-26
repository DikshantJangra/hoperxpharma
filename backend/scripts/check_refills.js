const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rxId = 'cmjkt30gy0001it8vy6wy4n2j';
    console.log(`Checking Prescription: ${rxId}`);

    const rx = await prisma.prescription.findUnique({
        where: { id: rxId },
        include: {
            refills: {
                include: {
                    items: {
                        include: {
                            prescriptionItem: {
                                include: { drug: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!rx) {
        console.log('Prescription NOT FOUND');
        return;
    }

    console.log(`Total Refills Configured: ${rx.totalRefills}`);
    console.log(`Refills Found in DB: ${rx.refills.length}`);

    rx.refills.forEach((r, i) => {
        console.log(`\nRefill #${i + 1} (ID: ${r.id}, Status: ${r.status})`);
        r.items.forEach(item => {
            console.log(` - Item: ${item.prescriptionItem?.drug?.name} (DrugID: ${item.prescriptionItem?.drugId})`);
            console.log(`   DispensedAt: ${item.dispensedAt}`);
            console.log(`   Qty: ${item.quantityDispensed}`);
        });
    });

    const lastRefill = rx.refills[rx.refills.length - 1];
    if (lastRefill && lastRefill.refillNumber === 38) {
        console.log(`\nDeleting Corrupted Refill #${lastRefill.refillNumber} (${lastRefill.id})...`);
        await prisma.refill.delete({ where: { id: lastRefill.id } });
        console.log('Deleted.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
