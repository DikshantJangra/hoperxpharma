const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSpecificParacetamol() {
    try {
        console.log('Looking for exact "Paracetamol" entry...\n');

        // Find exact match for "Paracetamol"
        const exactMatch = await prisma.drug.findMany({
            where: {
                name: {
                    equals: 'Paracetamol',
                    mode: 'insensitive'
                }
            }
        });

        console.log(`Found ${exactMatch.length} exact matches for "Paracetamol":`);
        exactMatch.forEach(drug => {
            console.log(`\nID: ${drug.id}`);
            console.log(`Name: ${drug.name}`);
            console.log(`Strength: ${drug.strength}`);
            console.log(`Form: ${drug.form}`);
            console.log(`Manufacturer: ${drug.manufacturer}`);
            console.log(`HSN Code: ${drug.hsnCode}`);
            console.log(`GST Rate: ${drug.gstRate}`);
            console.log(`Default Unit: ${drug.defaultUnit}`);
            console.log(`Created At: ${drug.createdAt}`);
        });

        // Now test the search query that the API uses
        console.log('\n\n=== Testing API Search Query ===');
        const searchQuery = 'paracetamol';
        const apiResults = await prisma.drug.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: searchQuery,
                            mode: 'insensitive'
                        }
                    },
                    {
                        manufacturer: {
                            contains: searchQuery,
                            mode: 'insensitive'
                        }
                    },
                    {
                        form: {
                            contains: searchQuery,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            take: 20,
            orderBy: [
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                strength: true,
                form: true,
                manufacturer: true,
                hsnCode: true,
                gstRate: true,
                requiresPrescription: true,
                defaultUnit: true,
                lowStockThreshold: true
            }
        });

        console.log(`\nAPI would return ${apiResults.length} results (limit 20):`);
        apiResults.forEach((drug, index) => {
            console.log(`${index + 1}. ${drug.name} | ${drug.strength || 'N/A'} | ${drug.form || 'N/A'} | ${drug.manufacturer || 'N/A'}`);
        });

        // Check if exact "Paracetamol" is in the API results
        const exactInResults = apiResults.find(d => d.name === 'Paracetamol');
        if (exactInResults) {
            console.log('\n✅ Exact "Paracetamol" entry IS in the API results');
            console.log('Details:', exactInResults);
        } else {
            console.log('\n❌ Exact "Paracetamol" entry is NOT in the API results');
            console.log('This could be due to alphabetical ordering pushing it out of the top 20');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findSpecificParacetamol();
