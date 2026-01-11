/**
 * Auto-Map Salts Script
 * 
 * Analyzes drug generic names to automatically map them to the Salt master.
 * Supports strength extraction and combination handling.
 * 
 * Usage: npx ts-node backend/scripts/auto-map-salts.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// Known variations to help matching
const SALT_ALIASES: Record<string, string> = {
    'Amoxycillin': 'Amoxicillin',
    'Amoxycullin': 'Amoxicillin',
    'Aceclofenc': 'Aceclofenac',
    'Diclofenace': 'Diclofenac',
    'Pcm': 'Paracetamol',
    'Para': 'Paracetamol',
    'Acetaminophen': 'Paracetamol',
    'Levocetrizine': 'Levocetirizine',
    'Levocet': 'Levocetirizine',
    'Montelukast Sodium': 'Montelukast',
    'Cholecalciferol': 'Vitamin D3 (Cholecalciferol)',
    'Methylcobalamin': 'Vitamin B12 (Methylcobalamin)',
    'Ascorbic Acid': 'Vitamin C (Ascorbic Acid)',
    'Ferrous Ascorbate': 'Iron (Ferrous Sulfate)',
    'Thyroxine Sodium': 'Thyroxine', // Need to add Thyroxine to master
    'Clavulanic Acid': 'Amoxicillin + Clavulanic Acid', // HACK for now, or add specific salt
    'Calcium': 'Calcium Carbonate', // Common assumption
    'Vitamin D3': 'Vitamin D3 (Cholecalciferol)',
    'Insulin Glargine': 'Insulin', // Need to add Insulin
    'Montelukast': 'Montelukast',
    'Levosalbutamol': 'Salbutamol', // Chemically close enough for v1? Or add specific
    // Add more as discovered
};

async function main() {
    console.log(`🤖 Starting Auto-Mapping Script ${DRY_RUN ? '(DRY RUN)' : ''}...\n`);

    // 1. Load Salt Master map
    const salts = await prisma.salt.findMany();
    const saltMap = new Map<string, string>(); // Name -> ID
    const lowerSaltMap = new Map<string, string>(); // Lowercase Name -> ID

    salts.forEach(s => {
        saltMap.set(s.name, s.id);
        lowerSaltMap.set(s.name.toLowerCase(), s.id);
    });

    console.log(`📚 Loaded ${salts.length} master salts.`);

    // 2. Fetch unmapped drugs with generic names
    const unmappedDrugs = await prisma.drug.findMany({
        where: {
            genericName: { not: null },
            saltLinks: {
                none: {}
            }
        },
        select: {
            id: true,
            name: true,
            genericName: true,
            strength: true // Fetch fallback strength
        }
    });

    console.log(`💊 Found ${unmappedDrugs.length} unmapped drugs with generic names.`);

    let matchedCount = 0;
    let skippedCount = 0;
    let comboCount = 0;
    const reportLog: string[] = [];

    for (const drug of unmappedDrugs) {
        if (!drug.genericName) continue;

        const genericClean = drug.genericName
            .replace(/tablets?/gi, '')
            .replace(/capsules?/gi, '')
            .replace(/syrup/gi, '')
            .replace(/injection/gi, '')
            .trim();

        // Check fallback strength from column if needed
        const fallbackStrengthRaw = drug.strength || '';
        const fallbackMatch = fallbackStrengthRaw.match(/(\d+\.?\d*)\s*([a-zA-Z\/%]+)/);
        const fallbackStrengthVal = fallbackMatch ? fallbackMatch[1] : '';
        const fallbackStrengthUnit = fallbackMatch ? fallbackMatch[2] : '';

        // Split for combos (handle "+", "plus", "&", "/")
        // BUT be careful not to split "w/w" or "mg/ml"
        const parts = genericClean.split(/\s\+\s|\splus\s|\s&\s/i).map(p => p.trim()).filter(p => p);

        // Determine if combo
        const isCombo = parts.length > 1;
        if (isCombo) comboCount++;

        const mappingsToCreate: any[] = [];
        let processingSuccess = true;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            // Regex to extract Name and (Strength Unit)
            // Matches: "Amoxycillin (125mg)" or "Paracetamol 500mg" or "Metformin (500mg) SR"
            const match = part.match(/^(.+?)[\s\(]+([\d\.]+)\s*([a-zA-Z\/%]+)[\)]?.*?$/)
                || part.match(/^(.+?)[\s]+(\d+)\s*([a-zA-Z\/%]+).*?$/); // simpler no parens

            let saltNameCandidate = '';
            let strengthVal = '';
            let strengthUnit = '';

            if (match) {
                saltNameCandidate = match[1].trim();
                strengthVal = match[2];
                strengthUnit = match[3];
            } else {
                // Try to match just name if strength is missing
                saltNameCandidate = part.replace(/\(.*\)/, '').replace(/\d+.*$/, '').trim();

                // Use fallback strength if we have a candidate name but no regex strength
                // Only if it's NOT a combo (strength column usually applies to single salt or primary)
                if (!isCombo || i === 0) {
                    strengthVal = fallbackStrengthVal;
                    strengthUnit = fallbackStrengthUnit;
                }
            }

            // Cleaning salt name properties
            saltNameCandidate = saltNameCandidate.replace(/IP|BP|USP/g, '').trim();
            saltNameCandidate = saltNameCandidate.replace(/[\(\)]/g, '').trim(); // Remove stray parens

            // Check Alias
            if (SALT_ALIASES[saltNameCandidate]) {
                saltNameCandidate = SALT_ALIASES[saltNameCandidate];
            }

            // Check Master
            let saltId = saltMap.get(saltNameCandidate) || lowerSaltMap.get(saltNameCandidate.toLowerCase());

            // Try fuzzy finding "SaltName" -> "SaltName Something"
            if (!saltId) {
                // Find if any master salt STARTS with this candidate
                const possibleMatch = [...saltMap.keys()].find(k => k.toLowerCase().startsWith(saltNameCandidate.toLowerCase()));
                if (possibleMatch && saltNameCandidate.length > 3) {
                    saltId = saltMap.get(possibleMatch);
                }
            }

            if (saltId && strengthVal && strengthUnit) {
                mappingsToCreate.push({
                    drugId: drug.id,
                    saltId: saltId,
                    strengthValue: parseFloat(strengthVal),
                    strengthUnit: strengthUnit.toLowerCase(),
                    role: isCombo ? (i === 0 ? 'PRIMARY' : 'SECONDARY') : 'PRIMARY',
                    order: i + 1
                });
            } else {
                processingSuccess = false;
                reportLog.push(`❌ FAILED: ${drug.name} | Generic: ${drug.genericName} | Parsed: "${saltNameCandidate}" ${strengthVal}${strengthUnit} | Reason: ${!saltId ? 'Salt not found' : 'Missing strength'}`);
            }
        }

        if (processingSuccess && mappingsToCreate.length > 0) {
            if (!DRY_RUN) {
                for (const mapping of mappingsToCreate) {
                    await prisma.drugSaltLink.create({ data: mapping });
                }
            }
            matchedCount++;
            const debugStr = mappingsToCreate.map(m => `${saltMap.get(
                [...saltMap.entries()].find(([k, v]) => v === m.saltId)?.[0] || ''
            )} ${m.strengthValue}${m.strengthUnit}`).join(' + ');

            reportLog.push(`✅ MATCHED: ${drug.name} -> ${debugStr}`);
        } else if (mappingsToCreate.length === 0) {
            skippedCount++;
        } else {
            // Partial success is treated as failure for now (atomicity prefered)
            skippedCount++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Processed: ${unmappedDrugs.length}`);
    console.log(`   Matches Found: ${matchedCount}`);
    console.log(`   Combos Identified: ${comboCount}`);
    console.log(`   Skipped/Failed: ${skippedCount}`);

    if (DRY_RUN) {
        console.log(`\n📄 Report (Last 20 entries):`);
        console.log(reportLog.slice(-20).join('\n'));
        console.log(`\n⚠️ This was a DRY RUN. No changes applied.`);
    } else {
        console.log(`\n✅ Changes applied to database.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
