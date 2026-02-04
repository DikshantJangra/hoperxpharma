const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching last 3 sales...");
    const sales = await prisma.sale.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { drug: true } } }
    });

    sales.forEach(sale => {
        console.log(`Sale ID: ${sale.id} | Total: ${sale.total} | Date: ${sale.createdAt}`);
        sale.items.forEach(item => {
            console.log(` - Item: ${item.drug.name} | Qty: ${item.quantity} | MRP: ${item.mrp} | LineTotal: ${item.lineTotal}`);
        });
        console.log('---');
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
