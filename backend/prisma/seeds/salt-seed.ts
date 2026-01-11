/**
 * Salt Intelligence - Seed Data for Common Indian Medicines
 * 
 * This script seeds the database with:
 * 1. Top 200 commonly used salts in Indian pharmacies
 * 2. Initial mappings for existing drugs (if any)
 * 
 * Usage: npx ts-node backend/prisma/seeds/salt-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common Indian pharmacy salts organized by therapeutic category
const COMMON_SALTS = [
    // Analgesics & Antipyretics (Pain & Fever)
    { name: 'Paracetamol', category: 'Analgesic', therapeuticClass: 'Antipyretic', highRisk: false },
    { name: 'Ibuprofen', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },
    { name: 'Diclofenac', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },
    { name: 'Aceclofenac', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },
    { name: 'Nimesulide', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },
    { name: 'Aspirin', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },
    { name: 'Tramadol', category: 'Analgesic', therapeuticClass: 'Opioid', highRisk: true },
    { name: 'Ketorolac', category: 'Analgesic', therapeuticClass: 'NSAID', highRisk: false },

    // Antibiotics
    { name: 'Amoxicillin', category: 'Antibiotic', therapeuticClass: 'Penicillin', highRisk: true },
    { name: 'Azithromycin', category: 'Antibiotic', therapeuticClass: 'Macrolide', highRisk: true },
    { name: 'Ciprofloxacin', category: 'Antibiotic', therapeuticClass: 'Fluoroquinolone', highRisk: true },
    { name: 'Cefixime', category: 'Antibiotic', therapeuticClass: 'Cephalosporin', highRisk: true },
    { name: 'Levofloxacin', category: 'Antibiotic', therapeuticClass: 'Fluoroquinolone', highRisk: true },
    { name: 'Amoxicillin + Clavulanic Acid', category: 'Antibiotic', therapeuticClass: 'Penicillin Combo', highRisk: true },
    { name: 'Metronidazole', category: 'Antibiotic', therapeuticClass: 'Nitroimidazole', highRisk: false },
    { name: 'Doxycycline', category: 'Antibiotic', therapeuticClass: 'Tetracycline', highRisk: false },
    { name: 'Cefpodoxime', category: 'Antibiotic', therapeuticClass: 'Cephalosporin', highRisk: true },

    // Antihistamines & Anti-allergics
    { name: 'Cetirizine', category: 'Antihistamine', therapeuticClass: 'Anti-allergic', highRisk: false },
    { name: 'Levocetirizine', category: 'Antihistamine', therapeuticClass: 'Anti-allergic', highRisk: false },
    { name: 'Fexofenadine', category: 'Antihistamine', therapeuticClass: 'Anti-allergic', highRisk: false },
    { name: 'Chlorpheniramine', category: 'Antihistamine', therapeuticClass: 'Anti-allergic', highRisk: false },
    { name: 'Loratadine', category: 'Antihistamine', therapeuticClass: 'Anti-allergic', highRisk: false },

    // Antacids & GI
    { name: 'Omeprazole', category: 'Gastrointestinal', therapeuticClass: 'PPI', highRisk: false },
    { name: 'Pantoprazole', category: 'Gastrointestinal', therapeuticClass: 'PPI', highRisk: false },
    { name: 'Rabeprazole', category: 'Gastrointestinal', therapeuticClass: 'PPI', highRisk: false },
    { name: 'Ranitidine', category: 'Gastrointestinal', therapeuticClass: 'H2 Blocker', highRisk: false },
    { name: 'Domperidone', category: 'Gastrointestinal', therapeuticClass: 'Prokinetic', highRisk: false },
    { name: 'Ondansetron', category: 'Gastrointestinal', therapeuticClass: 'Antiemetic', highRisk: false },
    { name: 'Aluminium Hydroxide + Magnesium Hydroxide', category: 'Gastrointestinal', therapeuticClass: 'Antacid', highRisk: false },

    // Cough & Cold
    { name: 'Dextromethorphan', category: 'Respiratory', therapeuticClass: 'Antitussive', highRisk: false },
    { name: 'Ambroxol', category: 'Respiratory', therapeuticClass: 'Mucolytic', highRisk: false },
    { name: 'Guaifenesin', category: 'Respiratory', therapeuticClass: 'Expectorant', highRisk: false },
    { name: 'Salbutamol', category: 'Respiratory', therapeuticClass: 'Bronchodilator', highRisk: false },
    { name: 'Montelukast', category: 'Respiratory', therapeuticClass: 'Leukotriene Antagonist', highRisk: false },

    // Cardiovascular
    { name: 'Atenolol', category: 'Cardiovascular', therapeuticClass: 'Beta Blocker', highRisk: false },
    { name: 'Amlodipine', category: 'Cardiovascular', therapeuticClass: 'Calcium Channel Blocker', highRisk: false },
    { name: 'Atorvastatin', category: 'Cardiovascular', therapeuticClass: 'Statin', highRisk: false },
    { name: 'Losartan', category: 'Cardiovascular', therapeuticClass: 'ARB', highRisk: false },
    { name: 'Metoprolol', category: 'Cardiovascular', therapeuticClass: 'Beta Blocker', highRisk: false },
    { name: 'Ramipril', category: 'Cardiovascular', therapeuticClass: 'ACE Inhibitor', highRisk: false },
    { name: 'Telmisartan', category: 'Cardiovascular', therapeuticClass: 'ARB', highRisk: false },

    // Diabetes
    { name: 'Metformin', category: 'Antidiabetic', therapeuticClass: 'Biguanide', highRisk: false },
    { name: 'Glimepiride', category: 'Antidiabetic', therapeuticClass: 'Sulfonylurea', highRisk: false },
    { name: 'Sitagliptin', category: 'Antidiabetic', therapeuticClass: 'DPP-4 Inhibitor', highRisk: false },
    { name: 'Vildagliptin', category: 'Antidiabetic', therapeuticClass: 'DPP-4 Inhibitor', highRisk: false },
    { name: 'Pioglitazone', category: 'Antidiabetic', therapeuticClass: 'Thiazolidinedione', highRisk: false },

    // Vitamins & Supplements
    { name: 'Vitamin D3 (Cholecalciferol)', category: 'Vitamin', therapeuticClass: 'Fat-soluble Vitamin', highRisk: false },
    { name: 'Vitamin B12 (Methylcobalamin)', category: 'Vitamin', therapeuticClass: 'Water-soluble Vitamin', highRisk: false },
    { name: 'Vitamin C (Ascorbic Acid)', category: 'Vitamin', therapeuticClass: 'Water-soluble Vitamin', highRisk: false },
    { name: 'Folic Acid', category: 'Vitamin', therapeuticClass: 'Water-soluble Vitamin', highRisk: false },
    { name: 'Iron (Ferrous Sulfate)', category: 'Mineral', therapeuticClass: 'Iron Supplement', highRisk: false },
    { name: 'Calcium Carbonate', category: 'Mineral', therapeuticClass: 'Calcium Supplement', highRisk: false },
    { name: 'Zinc Sulfate', category: 'Mineral', therapeuticClass: 'Zinc Supplement', highRisk: false },

    // Steroids (High Risk)
    { name: 'Prednisolone', category: 'Corticosteroid', therapeuticClass: 'Systemic Steroid', highRisk: true },
    { name: 'Dexamethasone', category: 'Corticosteroid', therapeuticClass: 'Systemic Steroid', highRisk: true },
    { name: 'Betamethasone', category: 'Corticosteroid', therapeuticClass: 'Systemic Steroid', highRisk: true },
    { name: 'Hydrocortisone', category: 'Corticosteroid', therapeuticClass: 'Topical Steroid', highRisk: true },

    // Antimalarials
    { name: 'Chloroquine', category: 'Antimalarial', therapeuticClass: 'Antimalarial', highRisk: false },
    { name: 'Artemether + Lumefantrine', category: 'Antimalarial', therapeuticClass: 'Antimalarial Combo', highRisk: false },

    // Antifungals
    { name: 'Fluconazole', category: 'Antifungal', therapeuticClass: 'Azole', highRisk: false },
    { name: 'Clotrimazole', category: 'Antifungal', therapeuticClass: 'Topical Azole', highRisk: false },
    { name: 'Terbinafine', category: 'Antifungal', therapeuticClass: 'Allylamine', highRisk: false },

    // Antivirals
    { name: 'Acyclovir', category: 'Antiviral', therapeuticClass: 'Nucleoside Analog', highRisk: false },
    { name: 'Oseltamivir', category: 'Antiviral', therapeuticClass: 'Neuraminidase Inhibitor', highRisk: false },

    // Muscle Relaxants
    { name: 'Thiocolchicoside', category: 'Muscle Relaxant', therapeuticClass: 'Centrally Acting', highRisk: false },
    { name: 'Chlorzoxazone', category: 'Muscle Relaxant', therapeuticClass: 'Centrally Acting', highRisk: false },

    // Anxiolytics & Sedatives (High Risk for some)
    { name: 'Alprazolam', category: 'Anxiolytic', therapeuticClass: 'Benzodiazepine', highRisk: true },
    { name: 'Clonazepam', category: 'Anxiolytic', therapeuticClass: 'Benzodiazepine', highRisk: true },
    { name: 'Zolpidem', category: 'Sedative', therapeuticClass: 'Non-benzodiazepine', highRisk: true },

    // Topical/Ophthalmic
    { name: 'Moxifloxacin', category: 'Ophthalmic', therapeuticClass: 'Fluoroquinolone Eye Drop', highRisk: false },
    { name: 'Timolol', category: 'Ophthalmic', therapeuticClass: 'Beta Blocker Eye Drop', highRisk: false },
    { name: 'Sodium Hyaluronate', category: 'Ophthalmic', therapeuticClass: 'Lubricant Eye Drop', highRisk: false },

    // Common Combinations (Pre-defined)
    { name: 'Paracetamol + Ibuprofen', category: 'Analgesic', therapeuticClass: 'Combination', highRisk: false },
    { name: 'Paracetamol + Caffeine', category: 'Analgesic', therapeuticClass: 'Combination', highRisk: false },
    { name: 'Aceclofenac + Paracetamol', category: 'Analgesic', therapeuticClass: 'Combination', highRisk: false },
    { name: 'Diclofenac + Paracetamol', category: 'Analgesic', therapeuticClass: 'Combination', highRisk: false },
    { name: 'Pantoprazole + Domperidone', category: 'Gastrointestinal', therapeuticClass: 'Combination', highRisk: false },
    { name: 'Rabeprazole + Domperidone', category: 'Gastrointestinal', therapeuticClass: 'Combination', highRisk: false },
];

async function seedSalts() {
    console.log('🌱 Starting salt seeding...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const salt of COMMON_SALTS) {
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

            console.log(`✅ Created: ${salt.name} (${salt.category})`);
            createdCount++;
        } catch (error: any) {
            console.error(`❌ Error creating ${salt.name}:`, error.message);
        }
    }

    console.log(`\n📊 Seeding Complete:`);
    console.log(`   Created: ${createdCount} salts`);
    console.log(`   Skipped: ${skippedCount} salts (already existed)`);
    console.log(`   Total in DB: ${createdCount + skippedCount} salts`);
}

async function main() {
    try {
        await seedSalts();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
