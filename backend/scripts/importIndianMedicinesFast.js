const fs = require('fs');
const csv = require('csv-parser');
const database = require('../src/config/database');

const prisma = database.getClient();

/**
 * FAST Import - Uses bulk inserts instead of one-by-one
 */
async function importIndianMedicinesFast() {
    const csvPath = '/tmp/indian-medicine-dataset/DATA/indian_medicine_data.csv';

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found at:', csvPath);
        process.exit(1);
    }

    const allDrugs = [];
    let skipCount = 0;

    console.log('📖 Reading CSV file...');

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                // Skip discontinued medicines
                if (row.Is_discontinued === 'TRUE') {
                    skipCount++;
                    return;
                }

                const { name, strength, form } = parseMedicineName(row.name, row.pack_size_label);
                const composition = parseComposition(row.short_composition1, row.short_composition2);

                allDrugs.push({
                    name: name,
                    strength: strength,
                    form: form,
                    manufacturer: row.manufacturer_name || 'Unknown',
                    hsnCode: '30049099',
                    gstRate: 12,
                    requiresPrescription: false,
                    defaultUnit: parsePackUnit(row.pack_size_label),
                    lowStockThreshold: 20,
                    description: composition
                });
            })
            .on('end', async () => {
                console.log(`\n✅ Loaded ${allDrugs.length} medicines from CSV`);
                console.log(`⏭️  Skipped ${skipCount} discontinued medicines`);
                console.log('🚀 Starting BULK import to database...\n');

                const startTime = Date.now();
                let successCount = 0;
                let errorCount = 0;

                // Bulk insert in chunks of 1000
                const chunkSize = 1000;
                for (let i = 0; i < allDrugs.length; i += chunkSize) {
                    const chunk = allDrugs.slice(i, i + chunkSize);

                    try {
                        // Use createMany for bulk insert (much faster!)
                        const result = await prisma.drug.createMany({
                            data: chunk,
                            skipDuplicates: true // Skip if already exists
                        });

                        successCount += result.count;
                        console.log(`✓ Imported ${successCount} / ${allDrugs.length} medicines...`);
                    } catch (error) {
                        console.error(`❌ Error importing chunk ${i}-${i + chunkSize}:`, error.message);
                        errorCount += chunk.length;
                    }
                }

                const endTime = Date.now();
                const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

                console.log('\n' + '='.repeat(60));
                console.log('📊 IMPORT SUMMARY');
                console.log('='.repeat(60));
                console.log(`Total medicines processed: ${allDrugs.length}`);
                console.log(`✅ Successfully imported: ${successCount}`);
                console.log(`⏭️  Skipped (discontinued): ${skipCount}`);
                console.log(`❌ Failed: ${errorCount}`);
                console.log(`⏱️  Time taken: ${duration} minutes`);
                console.log(`🚀 Speed: ${Math.round(successCount / (duration || 1))} drugs/minute`);
                console.log('='.repeat(60));

                resolve({
                    total: allDrugs.length,
                    success: successCount,
                    skipped: skipCount,
                    failed: errorCount,
                    duration: duration
                });
            })
            .on('error', (error) => {
                console.error('❌ CSV parsing error:', error);
                reject(error);
            });
    });
}

function parseMedicineName(fullName, packSizeLabel) {
    let name = fullName;
    let strength = null;
    let form = 'Tablet';

    if (packSizeLabel) {
        const formMatch = packSizeLabel.match(/(tablet|capsule|syrup|injection|cream|ointment|gel|drops|suspension|powder|lotion|solution)/i);
        if (formMatch) {
            form = formMatch[1].charAt(0).toUpperCase() + formMatch[1].slice(1).toLowerCase();
        }
    }

    const strengthMatch = fullName.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|%|iu)/i);
    if (strengthMatch) {
        strength = strengthMatch[1] + strengthMatch[2].toLowerCase();
        name = fullName.replace(strengthMatch[0], '').trim();
    }

    name = name.replace(new RegExp(`\\s*${form}\\s*$`, 'i'), '').trim();

    return { name, strength, form };
}

function parseComposition(comp1, comp2) {
    const parts = [];
    if (comp1 && comp1.trim()) parts.push(comp1.trim());
    if (comp2 && comp2.trim()) parts.push(comp2.trim());
    return parts.join(' + ') || null;
}

function parsePackUnit(packSizeLabel) {
    if (!packSizeLabel) return 'Strip';

    if (packSizeLabel.includes('strip')) return 'Strip';
    if (packSizeLabel.includes('bottle')) return 'Bottle';
    if (packSizeLabel.includes('tube')) return 'Tube';
    if (packSizeLabel.includes('vial')) return 'Vial';
    if (packSizeLabel.includes('box')) return 'Box';

    return 'Strip';
}

// Run the import
importIndianMedicinesFast()
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
