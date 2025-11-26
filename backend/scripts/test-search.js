const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
    try {
        console.log('Testing drug search...\n');

        // Test 1: Search for "Paracetamol" exactly
        console.log('=== Test 1: Searching for "Paracetamol" ===');
        const test1 = await prisma.drug.findMany({
            where: {
                name: {
                    contains: 'Paracetamol',
                    mode: 'insensitive'
                }
            },
            take: 5
        });
        console.log(`Found ${test1.length} results:`);
        test1.forEach(drug => {
            console.log(`  - ${drug.name} | ${drug.strength} | ${drug.form} | ${drug.manufacturer}`);
        });

        // Test 2: Search for "paracetamol" lowercase
        console.log('\n=== Test 2: Searching for "paracetamol" (lowercase) ===');
        const test2 = await prisma.drug.findMany({
            where: {
                name: {
                    contains: 'paracetamol',
                    mode: 'insensitive'
                }
            },
            take: 5
        });
        console.log(`Found ${test2.length} results:`);
        test2.forEach(drug => {
            console.log(`  - ${drug.name} | ${drug.strength} | ${drug.form} | ${drug.manufacturer}`);
        });

        // Test 3: Check if any drug has "Paracetamol" in the name
        console.log('\n=== Test 3: Count all drugs with "paracetamol" in name ===');
        const count = await prisma.drug.count({
            where: {
                name: {
                    contains: 'paracetamol',
                    mode: 'insensitive'
                }
            }
        });
        console.log(`Total count: ${count}`);

        // Test 4: Get first 10 drugs to see what's in the database
        console.log('\n=== Test 4: First 10 drugs in database ===');
        const first10 = await prisma.drug.findMany({
            take: 10,
            orderBy: { name: 'asc' }
        });
        first10.forEach(drug => {
            console.log(`  - ${drug.name} | ${drug.strength} | ${drug.form}`);
        });

        // Test 5: Search using OR condition (like the actual implementation)
        console.log('\n=== Test 5: Search using OR condition (actual implementation) ===');
        const searchQuery = 'paracetamol';
        const test5 = await prisma.drug.findMany({
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
        console.log(`Found ${test5.length} results:`);
        test5.forEach(drug => {
            console.log(`  - ${drug.name} | ${drug.strength} | ${drug.form} | ${drug.manufacturer}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testSearch();
