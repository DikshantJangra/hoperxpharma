
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Drug Data for Auto-Mapping Strategy...');

    // Get total count
    const count = await prisma.drug.count();
    console.log(`Total Drugs: ${count}`);

    // Get samples with generic names
    const drugs = await prisma.drug.findMany({
        take: 50,
        where: {
            NOT: {
                genericName: null
            }
        },
        select: {
            id: true,
            name: true,
            genericName: true,
            strength: true,
            form: true
        }
    });

    console.log('\n💊 Sample Drugs (Generic Matches):');
    console.table(drugs.map(d => ({
        Name: d.name.substring(0, 20),
        Generic: d.genericName?.substring(0, 30),
        Strength: d.strength,
        Form: d.form
    })));

    // Check unique strength formats
    const strengths = await prisma.drug.groupBy({
        by: ['strength'],
        _count: true,
        orderBy: {
            _count: {
                strength: 'desc'
            }
        },
        take: 20
    });

    console.log('\n💪 Common Strength Formats:');
    console.table(strengths);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
