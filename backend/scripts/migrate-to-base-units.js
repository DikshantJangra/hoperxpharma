/**
 * Migration Script: Basic Unit Setup for Existing Drugs
 * 
 * This script initializes base units and creates default conversions
 * for existing drugs in the database.
 * 
 * Run this AFTER the Prisma migration has been applied.
 * 
 * Usage: node backend/scripts/migrate-to-base-units.js
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../src/config/logger');

const prisma = new PrismaClient();

/**
 * Determine base unit from drug form
 */
function determineBaseUnit(drug) {
    const form = (drug.form || '').toLowerCase();

    if (form.includes('tablet') || form.includes('capsule') || form.includes('cap')) {
        return 'tablet';
    } else if (form.includes('syrup') || form.includes('liquid') || form.includes('suspension')) {
        return 'ml';
    } else if (form.includes('ointment') || form.includes('cream') || form.includes('gel')) {
        return 'gm';
    } else if (form.includes('injection') || form.includes('vial') || form.includes('ampoule')) {
        return 'unit';
    }

    // Default fallback
    return 'unit';
}

/**
 * Get default display unit based on base unit
 */
function getDefaultDisplayUnit(baseUnit) {
    const displayMap = {
        'tablet': 'strip',
        'ml': 'bottle',
        'gm': 'tube',
        'unit': 'pack'
    };

    return displayMap[baseUnit] || 'pack';
}

/**
 * Get default conversion factor
 */
function getDefaultConversion(baseUnit, displayUnit) {
    // Common Indian pharmacy defaults
    if (baseUnit === 'tablet' && displayUnit === 'strip') {
        return 10; // 1 strip = 10 tablets (most common)
    } else if (baseUnit === 'ml' && displayUnit === 'bottle') {
        return 100; // 1 bottle = 100ml (most common for syrups)
    } else if (baseUnit === 'gm' && displayUnit === 'tube') {
        return 30; // 1 tube = 30gm (most common)
    }

    return 1; // 1:1 mapping
}

/**
 * Main migration function with batch processing
 */
async function migrateToBaseUnits(batchSize = 50) {
    logger.info('='.repeat(60));
    logger.info('Starting Base Unit Migration (Batched)');
    logger.info('='.repeat(60));

    try {
        // Count total drugs first
        const totalDrugs = await prisma.drug.count();
        logger.info(`Total drugs to process: ${totalDrugs}`);

        let processedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let lastId = undefined;

        while (processedCount < totalDrugs) {
            // Fetch batch of drugs
            const drugs = await prisma.drug.findMany({
                take: batchSize,
                skip: lastId ? 1 : 0,
                cursor: lastId ? { id: lastId } : undefined,
                orderBy: { id: 'asc' },
                include: {
                    inventory: true
                }
            });

            if (drugs.length === 0) break;

            logger.info(`Processing batch: ${drugs.length} drugs (Progress: ${processedCount}/${totalDrugs})`);

            for (const drug of drugs) {
                lastId = drug.id; // Update cursor
                processedCount++;

                try {
                    // Skip if already has base unit configured
                    if (drug.baseUnit) {
                        skippedCount++;
                        continue;
                    }

                    // Determine base unit
                    const baseUnit = determineBaseUnit(drug);
                    const displayUnit = getDefaultDisplayUnit(baseUnit);
                    const conversion = getDefaultConversion(baseUnit, displayUnit);

                    // Update drug with base unit info
                    await prisma.drug.update({
                        where: { id: drug.id },
                        data: {
                            baseUnit,
                            displayUnit,
                            // Convert old threshold to base units
                            lowStockThresholdBase: drug.lowStockThreshold
                                ? drug.lowStockThreshold * conversion
                                : null
                        }
                    });

                    // Create default unit conversion record
                    await prisma.drugUnit.upsert({
                        where: {
                            drugId_parentUnit_childUnit: {
                                drugId: drug.id,
                                parentUnit: displayUnit,
                                childUnit: baseUnit
                            }
                        },
                        create: {
                            drugId: drug.id,
                            baseUnit,
                            parentUnit: displayUnit,
                            childUnit: baseUnit,
                            conversion,
                            isDefault: true
                        },
                        update: {
                            conversion,
                            isDefault: true
                        }
                    });

                    // Migrate existing inventory batches
                    for (const batch of drug.inventory) {
                        // Skip if already migrated (check if baseUnitQuantity matches logic)
                        if (batch.baseUnitQuantity !== null && batch.baseUnitQuantity !== undefined) {
                            // Optionally skip, or force update. Let's force update 
                            // only if baseUnitQuantity looks missing/wrong?
                            // For safety, let's just update if it's suspicious, or always update for now.
                        }

                        // Set base unit quantity = current quantity * conversion
                        // Assuming current `quantityInStock` is in display units (strips/bottles)
                        const currentQty = Number(batch.quantityInStock) || 0;
                        const baseQty = currentQty * conversion;

                        await prisma.inventoryBatch.update({
                            where: { id: batch.id },
                            data: {
                                baseUnitQuantity: baseQty,
                                receivedUnit: displayUnit,
                                receivedQuantity: currentQty,
                                baseUnitReserved: 0
                            }
                        });
                    }

                    updatedCount++;
                    // logger.info(`  ✓ Migrated ${drug.name} (1 ${displayUnit} = ${conversion} ${baseUnit})`);

                } catch (error) {
                    errorCount++;
                    logger.error(`Error processing drug ${drug.id} (${drug.name}): ${error.message}`);
                }
            }
        }

        logger.info('='.repeat(60));
        logger.info('Migration Summary');
        logger.info('='.repeat(60));
        logger.info(`Total Processed: ${processedCount}`);
        logger.info(`✓ Updated: ${updatedCount}`);
        logger.info(`⊘ Skipped: ${skippedCount}`);
        logger.info(`✗ Errors: ${errorCount}`);
        logger.info('='.repeat(60));

        if (errorCount === 0) {
            logger.info('✓ Migration completed successfully!');
        } else {
            logger.warn(`⚠️  Migration completed with ${errorCount} errors. Please review logs.`);
        }

    } catch (error) {
        logger.error('Fatal error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    migrateToBaseUnits()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateToBaseUnits };
