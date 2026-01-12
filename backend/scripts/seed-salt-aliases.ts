const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SALT_ALIASES = {
    'Paracetamol': ['PCM', 'Acetaminophen'],
    'Amoxycillin': ['Amox', 'Amoxy'],
    'Metformin': ['Metformin Hydrochloride', 'Metformin HCl'],
    'Atorvastatin': ['Atorva'],
    'Pantoprazole': ['Panto'],
    'Levocetirizine': ['Levo', 'Levocet'],
    'Montelukast': ['Montelu'],
    'Diclofenac': ['Diclo'],
    'Ibuprofen': ['Ibu'],
    'Azithromycin': ['Azithro'],
    'Caffeine': ['Caff']
};

async function seedAliases() {
    console.log('🌱 Seeding Salt Aliases...');

    let updatedCount = 0;

    for (const [name, aliases] of Object.entries(SALT_ALIASES)) {
        try {
            // Find salt by ignoring case
            const salt = await prisma.salt.findFirst({
                where: {
                    name: {
                        equals: name,
                        mode: 'insensitive'
                    }
                }
            });

            if (salt) {
                await prisma.salt.update({
                    where: { id: salt.id },
                    data: {
                        aliases: aliases // Overwrite or could merge if needed
                    }
                });
                console.log(`✅ Updated ${salt.name}: [${aliases.join(', ')}]`);
                updatedCount++;
            } else {
                console.log(`⚠️ Salt not found: ${name}`);
            }
        } catch (error) {
            console.error(`❌ Error updating ${name}:`, error.message);
        }
    }

    console.log(`\n🎉 Seed completed! Updated ${updatedCount} salts.`);
    await prisma.$disconnect();
}

seedAliases();
