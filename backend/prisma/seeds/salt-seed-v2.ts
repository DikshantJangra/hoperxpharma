/**
 * Salt Intelligence - Seed Data v2 (Supplementary)
 * 
 * Adds missing salts identified during auto-mapping dry run.
 * 
 * Usage: npx ts-node backend/prisma/seeds/salt-seed-v2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPPLEMENTARY_SALTS = [
    // Missing from initial list
    { name: 'Thyroxine', category: 'Hormone', therapeuticClass: 'Thyroid Hormone', highRisk: false },
    { name: 'Insulin', category: 'Antidiabetic', therapeuticClass: 'Insulin', highRisk: true },
    { name: 'Diphenhydramine', category: 'Antihistamine', therapeuticClass: 'Sedating Antihistamine', highRisk: false },
    { name: 'Clavulanic Acid', category: 'Antibiotic', therapeuticClass: 'Beta-lactamase Inhibitor', highRisk: false },
    { name: 'Calcium Carbonate', category: 'Mineral', therapeuticClass: 'Calcium Supplement', highRisk: false }, // Explicit alias target
    { name: 'Phenylephrine', category: 'Respiratory', therapeuticClass: 'Decongestant', highRisk: false },
    { name: 'Caffeine', category: 'CNS Stimulant', therapeuticClass: 'Stimulant', highRisk: false },
    { name: 'Codeine', category: 'Analgesic', therapeuticClass: 'Opioid', highRisk: true },

    // Specific variants
    { name: 'Sildenafil', category: 'Urology', therapeuticClass: 'PDE5 Inhibitor', highRisk: false },
    { name: 'Tadalafil', category: 'Urology', therapeuticClass: 'PDE5 Inhibitor', highRisk: false },

    // Topicals
    { name: 'Povidone Iodine', category: 'Antiseptic', therapeuticClass: 'Topical', highRisk: false },
    { name: 'Silver Nitrate', category: 'Antiseptic', therapeuticClass: 'Topical', highRisk: false },
    { name: 'Luliconazole', category: 'Antifungal', therapeuticClass: 'Topical Azole', highRisk: false },
];

async function main() {
    console.log('🌱 Starting supplementary salt seeding (v2)...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const salt of SUPPLEMENTARY_SALTS) {
        try {
            const existing = await prisma.salt.findUnique({
                where: { name: salt.name }
            });

            if (existing) {
                console.log(`⏭️  Skipping: ${salt.name} (already exists)`);
                skippedCount++;
                continue;
            }

            await prisma.salt.create({
                data: salt
            });

            console.log(`✅ Created: ${salt.name}`);
            createdCount++;
        } catch (error: any) {
            console.error(`❌ Error creating ${salt.name}:`, error.message);
        }
    }

    console.log(`\n📊 V2 Seeding Complete:`);
    console.log(`   Created: ${createdCount} salts`);
    console.log(`   Skipped: ${skippedCount} salts`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
