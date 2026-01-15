/**
 * Medicine Data Migration Script
 * 
 * Migrates medicine data from medicine-index.json to the new Medicine Master database.
 * Requirements: 5.1, 5.6
 * 
 * Usage:
 *   npm run migrate:medicines -- --source=path/to/medicine-index.json
 *   npm run migrate:medicines -- --dry-run
 */

import { PrismaClient } from '@prisma/client';
import { migrationService } from '../src/services/MigrationService';
import { indexManagementService } from '../src/services/IndexManagementService';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface MigrationOptions {
  sourceFile: string;
  dryRun: boolean;
  batchSize: number;
  skipIndexing: boolean;
}

interface MigrationStats {
  totalRecords: number;
  processed: number;
  created: number;
  deduplicated: number;
  failed: number;
  errors: Array<{ record: any; error: string }>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

async function runMigration(options: MigrationOptions): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalRecords: 0,
    processed: 0,
    created: 0,
    deduplicated: 0,
    failed: 0,
    errors: [],
    startTime: new Date(),
  };

  console.log('🚀 Starting Medicine Data Migration');
  console.log('Options:', options);
  console.log('');

  try {
    // Read source file
    console.log(`📖 Reading source file: ${options.sourceFile}`);
    const fileContent = fs.readFileSync(options.sourceFile, 'utf-8');
    const sourceData = JSON.parse(fileContent);

    // Determine data structure
    let medicines: any[] = [];
    if (Array.isArray(sourceData)) {
      medicines = sourceData;
    } else if (sourceData.medicines && Array.isArray(sourceData.medicines)) {
      medicines = sourceData.medicines;
    } else {
      throw new Error('Invalid data format: Expected array or object with medicines array');
    }

    stats.totalRecords = medicines.length;
    console.log(`✅ Found ${stats.totalRecords} medicine records`);
    console.log('');

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be written');
      console.log('');
    }

    // Process in batches
    const batches = Math.ceil(medicines.length / options.batchSize);
    console.log(`📦 Processing ${batches} batches of ${options.batchSize} records each`);
    console.log('');

    for (let i = 0; i < batches; i++) {
      const start = i * options.batchSize;
      const end = Math.min(start + options.batchSize, medicines.length);
      const batch = medicines.slice(start, end);

      console.log(`Processing batch ${i + 1}/${batches} (records ${start + 1}-${end})`);

      for (const record of batch) {
        try {
          stats.processed++;

          // Normalize data
          const normalized = await migrationService.normalizeRecord(record);

          // Check for duplicates
          const duplicates = await migrationService.findPotentialDuplicates(normalized);

          if (duplicates.length > 0) {
            stats.deduplicated++;
            console.log(`  ⚠️  Duplicate found: ${normalized.name} (skipping)`);

            // Create ID mapping to existing record
            if (!options.dryRun && record.id) {
              await migrationService.createIdMapping(
                record.id,
                duplicates[0].canonicalId
              );
            }
            continue;
          }

          // Create medicine record
          if (!options.dryRun) {
            const result = await migrationService.importRecord(normalized);
            stats.created++;

            // Create ID mapping
            if (record.id) {
              await migrationService.createIdMapping(record.id, result.id);
            }

            // Index in Typesense
            if (!options.skipIndexing) {
              await indexManagementService.indexMedicine(result.id);
            }
          } else {
            stats.created++;
          }

          // Progress indicator
          if (stats.processed % 100 === 0) {
            console.log(`  Progress: ${stats.processed}/${stats.totalRecords} (${Math.round((stats.processed / stats.totalRecords) * 100)}%)`);
          }
        } catch (error: any) {
          stats.failed++;
          stats.errors.push({
            record: record.name || record.id || 'unknown',
            error: error.message,
          });

          if (stats.failed <= 10) {
            console.error(`  ❌ Error processing record: ${error.message}`);
          }
        }
      }

      console.log(`  Batch ${i + 1} complete: ${stats.created} created, ${stats.deduplicated} deduplicated, ${stats.failed} failed`);
      console.log('');
    }

    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Records:     ${stats.totalRecords}`);
    console.log(`Processed:         ${stats.processed}`);
    console.log(`Created:           ${stats.created}`);
    console.log(`Deduplicated:      ${stats.deduplicated}`);
    console.log(`Failed:            ${stats.failed}`);
    console.log(`Duration:          ${Math.round(stats.duration / 1000)}s`);
    console.log(`Records/second:    ${Math.round(stats.processed / (stats.duration / 1000))}`);
    console.log('═══════════════════════════════════════════════════════════');

    if (stats.errors.length > 0) {
      console.log('');
      console.log('❌ ERRORS:');
      stats.errors.slice(0, 20).forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err.record}: ${err.error}`);
      });
      if (stats.errors.length > 20) {
        console.log(`  ... and ${stats.errors.length - 20} more errors`);
      }
    }

    // Generate migration report
    if (!options.dryRun) {
      const reportPath = path.join(__dirname, '../migration-reports', `migration-${Date.now()}.json`);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));
      console.log('');
      console.log(`📄 Migration report saved to: ${reportPath}`);
    }

    return stats;
  } catch (error: any) {
    console.error('');
    console.error('💥 MIGRATION FAILED:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    sourceFile: 'medicine-index.json',
    dryRun: false,
    batchSize: 100,
    skipIndexing: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--source=')) {
      options.sourceFile = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--skip-indexing') {
      options.skipIndexing = true;
    }
  }

  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();

  runMigration(options)
    .then((stats) => {
      if (stats.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigration, MigrationOptions, MigrationStats };
