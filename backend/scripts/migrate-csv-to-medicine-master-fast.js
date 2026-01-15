/**
 * FAST CSV to Medicine Master Migration Script
 * 
 * Uses bulk operations and optimized queries for speed
 * Estimated time: ~30-45 minutes for 250k records
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CSV field mapping
const CSV_FIELDS = {
  id: 'id',
  name: 'name',
  price: 'price',
  isDiscontinued: 'Is_discontinued',
  manufacturer: 'manufacturer_name',
  type: 'type',
  packSize: 'pack_size_label',
  composition1: 'short_composition1',
  composition2: 'short_composition2',
  saltComposition: 'salt_composition',
  description: 'medicine_desc',
  sideEffects: 'side_effects',
  drugInteractions: 'drug_interactions'
};

/**
 * Parse salt composition from CSV
 */
function parseSaltComposition(compositionText) {
  if (!compositionText || compositionText.trim() === '') {
    return [];
  }

  const salts = [];
  const parts = compositionText.split('+').map(s => s.trim());

  for (const part of parts) {
    const match = part.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|%)\)$/i);
    
    if (match) {
      salts.push({
        name: match[1].trim(),
        strengthValue: parseFloat(match[2]),
        strengthUnit: match[3].toLowerCase()
      });
    } else {
      salts.push({
        name: part.trim(),
        strengthValue: 0,
        strengthUnit: 'mg'
      });
    }
  }

  return salts;
}

/**
 * Extract form from pack size
 */
function extractForm(packSizeLabel) {
  if (!packSizeLabel) return 'Unknown';

  const formMap = {
    'tablet': 'Tablet',
    'capsule': 'Capsule',
    'syrup': 'Syrup',
    'suspension': 'Suspension',
    'injection': 'Injection',
    'cream': 'Cream',
    'ointment': 'Ointment',
    'gel': 'Gel',
    'drops': 'Drops',
    'inhaler': 'Inhaler',
    'powder': 'Powder',
    'lotion': 'Lotion',
    'solution': 'Solution'
  };

  const lowerLabel = packSizeLabel.toLowerCase();
  for (const [key, value] of Object.entries(formMap)) {
    if (lowerLabel.includes(key)) {
      return value;
    }
  }

  return 'Other';
}

/**
 * Extract numeric pack size from label
 */
function extractPackSizeNumeric(packSizeLabel) {
  if (!packSizeLabel) return 'Unknown';

  const match = packSizeLabel.match(/(\d+)\s*(tablets?|capsules?|ml|mg|g|units?)?/i);
  
  if (match) {
    return match[1];
  }

  return packSizeLabel;
}

/**
 * Determine if medicine requires prescription
 */
function requiresPrescription(saltComposition) {
  if (!saltComposition) return false;

  const prescriptionRequired = [
    'antibiotic', 'azithromycin', 'amoxycillin', 'clavulanic',
    'ciprofloxacin', 'levofloxacin', 'cefixime', 'ofloxacin',
    'metronidazole', 'doxycycline', 'clindamycin'
  ];

  const lower = saltComposition.toLowerCase();
  return prescriptionRequired.some(drug => lower.includes(drug));
}

/**
 * Determine schedule
 */
function determineSchedule(saltComposition) {
  if (!saltComposition) return null;

  const lower = saltComposition.toLowerCase();
  
  const scheduleH = ['antibiotic', 'azithromycin', 'amoxycillin', 'ciprofloxacin'];
  if (scheduleH.some(drug => lower.includes(drug))) {
    return 'H';
  }

  const scheduleH1 = ['cefixime', 'levofloxacin'];
  if (scheduleH1.some(drug => lower.includes(drug))) {
    return 'H1';
  }

  return null;
}

/**
 * Process medicines in bulk
 */
async function processBatch(medicines, batchNumber, totalBatches) {
  const startTime = Date.now();
  
  console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${medicines.length} records)`);
  
  // Step 1: Collect all unique salts
  const saltMap = new Map();
  
  for (const med of medicines) {
    const salts = parseSaltComposition(med[CSV_FIELDS.saltComposition]);
    for (const salt of salts) {
      if (!saltMap.has(salt.name)) {
        saltMap.set(salt.name, salt);
      }
    }
  }
  
  // Step 2: Bulk upsert salts
  const saltNames = Array.from(saltMap.keys());
  const existingSalts = await prisma.salt.findMany({
    where: {
      name: { in: saltNames }
    }
  });
  
  const existingSaltNames = new Set(existingSalts.map(s => s.name));
  const newSalts = saltNames.filter(name => !existingSaltNames.has(name));
  
  if (newSalts.length > 0) {
    await prisma.$transaction(
      newSalts.map(name => 
        prisma.salt.create({
          data: {
            name,
            scientificName: name,
            category: 'ACTIVE',
            status: 'APPROVED',
            createdBy: 'system'
          }
        })
      )
    );
  }
  
  // Fetch all salts again
  const allSalts = await prisma.salt.findMany({
    where: {
      name: { in: saltNames }
    }
  });
  
  const saltIdMap = new Map(allSalts.map(s => [s.name, s.id]));
  
  // Step 3: Prepare medicine data
  const medicineData = [];
  const saltLinkData = [];
  const idMappingData = [];
  
  for (const csvRow of medicines) {
    const salts = parseSaltComposition(csvRow[CSV_FIELDS.saltComposition]);
    const form = extractForm(csvRow[CSV_FIELDS.packSize]);
    const packSize = extractPackSizeNumeric(csvRow[CSV_FIELDS.packSize]);
    const compositionText = csvRow[CSV_FIELDS.saltComposition] || 
                           `${csvRow[CSV_FIELDS.composition1] || ''} ${csvRow[CSV_FIELDS.composition2] || ''}`.trim();
    
    const medicineId = `med_${csvRow[CSV_FIELDS.id]}_${Date.now()}`;
    
    medicineData.push({
      id: medicineId,
      legacyIds: [csvRow[CSV_FIELDS.id]],
      name: csvRow[CSV_FIELDS.name],
      genericName: salts.length > 0 ? salts[0].name : null,
      compositionText: compositionText || 'Unknown',
      form: form,
      packSize: packSize,
      manufacturerName: csvRow[CSV_FIELDS.manufacturer] || 'Unknown',
      schedule: determineSchedule(compositionText),
      requiresPrescription: requiresPrescription(compositionText),
      defaultGstRate: 12.0,
      status: csvRow[CSV_FIELDS.isDiscontinued] === 'TRUE' ? 'DISCONTINUED' : 'VERIFIED',
      confidenceScore: 80,
      usageCount: 0,
      createdBy: 'csv_migration'
    });
    
    // Prepare salt links
    for (let i = 0; i < salts.length; i++) {
      const salt = salts[i];
      const saltId = saltIdMap.get(salt.name);
      
      if (saltId) {
        saltLinkData.push({
          medicineId: medicineId,
          saltId: saltId,
          saltName: salt.name,
          strengthValue: salt.strengthValue,
          strengthUnit: salt.strengthUnit,
          role: i === 0 ? 'PRIMARY' : 'SECONDARY',
          order: i + 1
        });
      }
    }
    
    // Prepare ID mapping
    idMappingData.push({
      oldId: csvRow[CSV_FIELDS.id],
      canonicalId: medicineId,
      source: 'CSV_MIGRATION'
    });
  }
  
  // Step 4: Bulk insert medicines
  await prisma.medicineMaster.createMany({
    data: medicineData,
    skipDuplicates: true
  });
  
  // Step 5: Bulk insert salt links
  if (saltLinkData.length > 0) {
    await prisma.medicineSaltLink.createMany({
      data: saltLinkData,
      skipDuplicates: true
    });
  }
  
  // Step 6: Bulk insert ID mappings
  await prisma.idMapping.createMany({
    data: idMappingData,
    skipDuplicates: true
  });
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const rate = (medicines.length / elapsed).toFixed(1);
  console.log(`✅ Completed in ${elapsed}s (${rate} records/sec)`);
  
  return {
    success: medicines.length,
    failed: 0,
    rate: parseFloat(rate)
  };
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting FAST CSV to Medicine Master migration...\n');

  const csvPath = path.join(__dirname, '../../scripts/medicine-data/updated_indian_medicine_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const allMedicines = [];

  // Read CSV
  console.log('📖 Reading CSV file...');
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        allMedicines.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${allMedicines.length} medicines in CSV\n`);

  const BATCH_SIZE = 500; // Larger batches for speed
  const totalBatches = Math.ceil(allMedicines.length / BATCH_SIZE);
  
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    rates: []
  };

  const overallStart = Date.now();

  // Process in batches
  for (let i = 0; i < allMedicines.length; i += BATCH_SIZE) {
    const batch = allMedicines.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const result = await processBatch(batch, batchNumber, totalBatches);
      results.total += batch.length;
      results.success += result.success;
      results.failed += result.failed;
      results.rates.push(result.rate);
      
      // Progress update
      const progress = ((i + batch.length) / allMedicines.length * 100).toFixed(1);
      const elapsed = ((Date.now() - overallStart) / 1000 / 60).toFixed(1);
      const avgRate = results.rates.reduce((a, b) => a + b, 0) / results.rates.length;
      const remaining = (allMedicines.length - (i + batch.length)) / avgRate / 60;
      
      console.log(`📈 Progress: ${progress}% | Elapsed: ${elapsed}min | ETA: ${remaining.toFixed(1)}min`);
      
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error.message);
      results.failed += batch.length;
    }
  }

  const totalTime = ((Date.now() - overallStart) / 1000 / 60).toFixed(2);
  const avgRate = results.rates.reduce((a, b) => a + b, 0) / results.rates.length;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total records: ${results.total}`);
  console.log(`✅ Successful: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success rate: ${((results.success / results.total) * 100).toFixed(2)}%`);
  console.log(`⏱️  Total time: ${totalTime} minutes`);
  console.log(`⚡ Average rate: ${avgRate.toFixed(1)} records/second`);
  console.log('\n✅ Migration complete!');
}

// Run migration
runMigration()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
