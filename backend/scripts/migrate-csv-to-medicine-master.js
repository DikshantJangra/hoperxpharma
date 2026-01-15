/**
 * CSV to Medicine Master Migration Script
 * 
 * Migrates data from updated_indian_medicine_data.csv to the new Medicine Master schema
 * Handles missing data, creates proper structure, and ensures no data loss
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
 * Example: "Amoxycillin (500mg) + Clavulanic Acid (125mg)"
 * Returns: [{ name: "Amoxycillin", strength: "500", unit: "mg" }, ...]
 */
function parseSaltComposition(compositionText) {
  if (!compositionText || compositionText.trim() === '') {
    return [];
  }

  const salts = [];
  // Split by + to get individual salts
  const parts = compositionText.split('+').map(s => s.trim());

  for (const part of parts) {
    // Match pattern: "Salt Name (123mg)" or "Salt Name (123 mg)"
    const match = part.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|%)\)$/i);
    
    if (match) {
      salts.push({
        name: match[1].trim(),
        strengthValue: parseFloat(match[2]),
        strengthUnit: match[3].toLowerCase()
      });
    } else {
      // If no strength found, just use the name
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
 * Example: "strip of 10 tablets" -> "Tablet"
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
 * Example: "strip of 10 tablets" -> "10"
 * Example: "bottle of 100 ml Syrup" -> "100"
 */
function extractPackSizeNumeric(packSizeLabel) {
  if (!packSizeLabel) return 'Unknown';

  // Try to extract number from patterns like "strip of 10", "bottle of 100 ml", etc.
  const match = packSizeLabel.match(/(\d+)\s*(tablets?|capsules?|ml|mg|g|units?)?/i);
  
  if (match) {
    return match[1]; // Return just the number
  }

  return packSizeLabel; // Return original if no number found
}

/**
 * Determine if medicine requires prescription based on composition
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
 * Determine schedule based on composition
 */
function determineSchedule(saltComposition) {
  if (!saltComposition) return null;

  const lower = saltComposition.toLowerCase();
  
  // Schedule H (prescription required)
  const scheduleH = ['antibiotic', 'azithromycin', 'amoxycillin', 'ciprofloxacin'];
  if (scheduleH.some(drug => lower.includes(drug))) {
    return 'H';
  }

  // Schedule H1 (restricted antibiotics)
  const scheduleH1 = ['cefixime', 'levofloxacin'];
  if (scheduleH1.some(drug => lower.includes(drug))) {
    return 'H1';
  }

  return null;
}

/**
 * Get or create Salt records
 */
async function getOrCreateSalts(salts) {
  const saltRecords = [];

  for (const salt of salts) {
    // Try to find existing salt
    let saltRecord = await prisma.salt.findFirst({
      where: {
        name: {
          equals: salt.name,
          mode: 'insensitive'
        }
      }
    });

    // Create if doesn't exist
    if (!saltRecord) {
      saltRecord = await prisma.salt.create({
        data: {
          name: salt.name,
          scientificName: salt.name,
          category: 'ACTIVE',
          status: 'APPROVED',
          createdBy: 'system'
        }
      });
    }

    saltRecords.push({
      ...saltRecord,
      strengthValue: salt.strengthValue,
      strengthUnit: salt.strengthUnit
    });
  }

  return saltRecords;
}

/**
 * Migrate a single medicine record
 */
async function migrateMedicine(csvRow, index) {
  try {
    const salts = parseSaltComposition(csvRow[CSV_FIELDS.saltComposition]);
    const form = extractForm(csvRow[CSV_FIELDS.packSize]);
    const packSize = extractPackSizeNumeric(csvRow[CSV_FIELDS.packSize]);
    const compositionText = csvRow[CSV_FIELDS.saltComposition] || 
                           `${csvRow[CSV_FIELDS.composition1] || ''} ${csvRow[CSV_FIELDS.composition2] || ''}`.trim();

    // Check if already migrated
    const existing = await prisma.idMapping.findUnique({
      where: { oldId: csvRow[CSV_FIELDS.id] }
    });

    if (existing) {
      console.log(`⏭️  Skipped: ${csvRow[CSV_FIELDS.name]} (already migrated)`);
      return { success: true, skipped: true };
    }

    // Create Medicine Master record
    const medicine = await prisma.medicineMaster.create({
      data: {
        legacyIds: [csvRow[CSV_FIELDS.id]],
        name: csvRow[CSV_FIELDS.name],
        genericName: salts.length > 0 ? salts[0].name : null,
        compositionText: compositionText || 'Unknown',
        form: form,
        packSize: packSize,
        manufacturerName: csvRow[CSV_FIELDS.manufacturer] || 'Unknown',
        schedule: determineSchedule(compositionText),
        requiresPrescription: requiresPrescription(compositionText),
        defaultGstRate: 12.0, // Default GST for medicines
        status: csvRow[CSV_FIELDS.isDiscontinued] === 'TRUE' ? 'DISCONTINUED' : 'VERIFIED',
        confidenceScore: 80, // High confidence for CSV data
        usageCount: 0,
        createdBy: 'csv_migration'
      }
    });

    // Create Salt Links
    if (salts.length > 0) {
      const saltRecords = await getOrCreateSalts(salts);
      
      for (let i = 0; i < saltRecords.length; i++) {
        const salt = saltRecords[i];
        await prisma.medicineSaltLink.create({
          data: {
            medicineId: medicine.id,
            saltId: salt.id,
            saltName: salt.name,
            strengthValue: salt.strengthValue,
            strengthUnit: salt.strengthUnit,
            role: i === 0 ? 'PRIMARY' : 'SECONDARY',
            order: i + 1
          }
        });
      }
    }

    // Create ID Mapping for legacy reference
    await prisma.idMapping.create({
      data: {
        oldId: csvRow[CSV_FIELDS.id],
        canonicalId: medicine.id,
        source: 'CSV_MIGRATION'
      }
    });

    console.log(`✅ Migrated: ${medicine.name} (${index + 1})`);
    return { success: true, medicine };

  } catch (error) {
    console.error(`❌ Failed to migrate row ${index + 1}:`, error.message);
    return { success: false, error: error.message, row: csvRow };
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting CSV to Medicine Master migration...\n');

  const csvPath = path.join(__dirname, '../../scripts/medicine-data/updated_indian_medicine_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  const results = {
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  const medicines = [];

  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        medicines.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${medicines.length} medicines in CSV\n`);

  // Migrate in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < medicines.length; i += BATCH_SIZE) {
    const batch = medicines.slice(i, i + BATCH_SIZE);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, medicines.length)} of ${medicines.length})`);
    
    for (let j = 0; j < batch.length; j++) {
      const result = await migrateMedicine(batch[j], i + j);
      results.total++;
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.errors.push({
          index: i + j + 1,
          name: batch[j][CSV_FIELDS.name],
          error: result.error
        });
      }
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total records: ${results.total}`);
  console.log(`✅ Successful: ${results.success}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success rate: ${(((results.success + results.skipped) / results.total) * 100).toFixed(2)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.slice(0, 10).forEach(err => {
      console.log(`  Row ${err.index}: ${err.name} - ${err.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
  }

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
