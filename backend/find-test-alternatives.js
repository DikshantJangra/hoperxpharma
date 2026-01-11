const prisma = require('./src/db/prisma');

async function findAlternatives() {
    try {
        console.log('🔍 Searching for drugs with available alternatives...');

        // 1. Get all drugs with their salts and inventory
        const drugs = await prisma.drug.findMany({
            include: {
                saltLinks: {
                    orderBy: { saltId: 'asc' } // Sort for consistent signature
                },
                inventory: true
            }
        });

        console.log(`Analyzing ${drugs.length} drugs...`);

        // 2. Group by Salt Signature
        const groups = {};

        drugs.forEach(drug => {
            if (drug.saltLinks.length === 0) return;

            // Create signature: saltId1-saltId2-...
            const signature = drug.saltLinks.map(l => l.saltId).join('-');

            if (!groups[signature]) {
                groups[signature] = [];
            }
            groups[signature].push(drug);
        });

        // 3. Find groups with valid substitution scenarios
        let found = 0;
        console.log('\n✅ SUGGESTED TEST SCENARIOS:\n');

        for (const [signature, group] of Object.entries(groups)) {
            if (group.length < 2) continue; // No alternatives exist

            // Calculate stock for each drug in group
            const drugsWithStock = group.map(d => {
                const totalStock = d.inventory.reduce((sum, i) => sum + i.quantityInStock, 0);
                return { ...d, totalStock };
            });

            // Find candidates: Drug A (Target) and Drug B (Stock > 0)
            // Ideally, suggest searching for a drug that is OUT OF STOCK, but has an IN STOCK alternative

            const outOfStockDrugs = drugsWithStock.filter(d => d.totalStock === 0);
            const inStockDrugs = drugsWithStock.filter(d => d.totalStock > 0);

            if (inStockDrugs.length > 0) {
                // Scenario 1: Search for Out-of-Stock item, get In-Stock result
                if (outOfStockDrugs.length > 0) {
                    const target = outOfStockDrugs[0];
                    const alt = inStockDrugs[0];
                    console.log(`Scenario A (Ideal): Search for "${target.name}" (0 Stock)`);
                    console.log(`   -> Found Substitute: "${alt.name}" (${alt.totalStock} in stock)`);
                    console.log('---');
                    found++;
                }
                // Scenario 2: Search for In-Stock item, get DIFFERENT In-Stock item
                else if (inStockDrugs.length >= 2) {
                    const target = inStockDrugs[0];
                    const alt = inStockDrugs[1];
                    console.log(`Scenario B (Variation): Search for "${target.name}" (${target.totalStock} stock)`);
                    console.log(`   -> Found Substitute: "${alt.name}" (${alt.totalStock} in stock)`);
                    console.log('---');
                    found++;
                }
            }

            if (found >= 5) break;
        }

        if (found === 0) {
            console.log('❌ No perfect test scenarios found (requires multiple drugs with same salts, one in stock).');
            console.log('You might need to add stock to a drug or map more salts.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

findAlternatives();
