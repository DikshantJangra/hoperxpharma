const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const database = require('../src/config/database');
const logger = require('../src/config/logger');

const prisma = database.getClient();

/**
 * Import Indian Medicine Dataset
 * Maps fields from the dataset to our Drug schema
 */
async function importIndianMedicines() {
    const csvPath = '/tmp/indian-medicine-dataset/DATA/indian_medicine_data.csv';

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found at:', csvPath);
        process.exit(1);
    }

    const drugs = [];
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    const errors = [];

    console.log('📖 Reading CSV file...');

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                drugs.push(row);
            })
            .on('end', async () => {
                console.log(`\n✅ Loaded ${drugs.length} medicines from CSV`);
                console.log('🔄 Starting import to database...\n');

                // Process in batches for better performance
                const batchSize = 100;
                for (let i = 0; i < drugs.length; i += batchSize) {
                    const batch = drugs.slice(i, i + batchSize);

                    for (const row of batch) {
                        try {
                            // Skip discontinued medicines
                            if (row.Is_discontinued === 'TRUE') {
                                skipCount++;
                                continue;
                            }

                            await createDrugFromRow(row);
                            successCount++;

                            if (successCount % 1000 === 0) {
                                console.log(`✓ Imported ${successCount} medicines...`);
                            }
                        } catch (error) {
                            errorCount++;
                            if (errors.length < 20) {
                                errors.push({
                                    name: row.name || 'Unknown',
                                    error: error.message
                                });
                            }
                        }
                    }
                }

                console.log('\n' + '='.repeat(60));
                console.log('📊 IMPORT SUMMARY');
                console.log('='.repeat(60));
                console.log(`Total medicines in CSV: ${drugs.length}`);
                console.log(`✅ Successfully imported: ${successCount}`);
                console.log(`⏭️  Skipped (discontinued): ${skipCount}`);
                console.log(`❌ Failed: ${errorCount}`);
                console.log('='.repeat(60));

                if (errors.length > 0) {
                    console.log('\n⚠️  Sample errors:');
                    errors.forEach((err, idx) => {
                        console.log(`${idx + 1}. ${err.name}: ${err.error}`);
                    });
                }

                resolve({
                    total: drugs.length,
                    success: successCount,
                    skipped: skipCount,
                    failed: errorCount,
                    errors: errors
                });
            })
            .on('error', (error) => {
                console.error('❌ CSV parsing error:', error);
                reject(error);
            });
    });
}

/**
 * Create drug from Indian Medicine Dataset row
 */
async function createDrugFromRow(row) {
    // Extract strength and form from name or composition
    const { name, strength, form } = parseMedicineName(row.name, row.pack_size_label);

    // Parse composition to get active ingredients
    const composition = parseComposition(row.short_composition1, row.short_composition2);

    const drugData = {
        name: name,
        strength: strength,
        form: form,
        manufacturer: row.manufacturer_name || 'Unknown',
        hsnCode: '30049099', // Default HSN for medicines
        gstRate: 12, // Standard GST rate for medicines in India
        requiresPrescription: false, // Default, can be updated later
        defaultUnit: parsePackUnit(row.pack_size_label),
        lowStockThreshold: 20, // Default threshold
        description: composition
    };

    // Check if drug already exists by name
    const existing = await prisma.drug.findFirst({
        where: {
            name: {
                equals: drugData.name,
                mode: 'insensitive'
            }
        }
    });

    if (existing) {
        // Drug already exists, skip
        return existing;
    } else {
        return await prisma.drug.create({
            data: drugData
        });
    }
}

/**
 * Parse medicine name to extract name, strength, and form
 */
function parseMedicineName(fullName, packSizeLabel) {
    let name = fullName;
    let strength = null;
    let form = 'Tablet'; // Default

    // Extract form from pack size label
    if (packSizeLabel) {
        const formMatch = packSizeLabel.match(/(tablet|capsule|syrup|injection|cream|ointment|gel|drops|suspension|powder|lotion|solution)/i);
        if (formMatch) {
            form = formMatch[1].charAt(0).toUpperCase() + formMatch[1].slice(1).toLowerCase();
        }
    }

    // Extract strength from name (e.g., "Augmentin 625 Duo Tablet" -> "625mg")
    const strengthMatch = fullName.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|%|iu)/i);
    if (strengthMatch) {
        strength = strengthMatch[1] + strengthMatch[2].toLowerCase();
        // Remove strength from name
        name = fullName.replace(strengthMatch[0], '').trim();
    }

    // Remove form from name if present
    name = name.replace(new RegExp(`\\s*${form}\\s*$`, 'i'), '').trim();

    return { name, strength, form };
}

/**
 * Parse composition from short_composition fields
 */
function parseComposition(comp1, comp2) {
    const parts = [];
    if (comp1 && comp1.trim()) parts.push(comp1.trim());
    if (comp2 && comp2.trim()) parts.push(comp2.trim());
    return parts.join(' + ') || null;
}

/**
 * Parse pack unit from pack_size_label
 */
function parsePackUnit(packSizeLabel) {
    if (!packSizeLabel) return 'Strip';

    if (packSizeLabel.includes('strip')) return 'Strip';
    if (packSizeLabel.includes('bottle')) return 'Bottle';
    if (packSizeLabel.includes('tube')) return 'Tube';
    if (packSizeLabel.includes('vial')) return 'Vial';
    if (packSizeLabel.includes('box')) return 'Box';

    return 'Strip'; // Default
}

// Run the import
importIndianMedicines()
    .then((result) => {
        console.log('\n✅ Import completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
