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
 * Main migration function
 */
async function migrateToBaseUnits() {
    logger.info('='.repeat(60));
    logger.info('Starting Base Unit Migration');
    logger.info('='.repeat(60));

    try {
        // Get all drugs
        const drugs = await prisma.drug.findMany({
            include: {
                inventory: true
            }
        });

        logger.info(`Found ${drugs.length} drugs to process`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const drug of drugs) {
            try {
                // Skip if already has base unit configured
                if (drug.baseUnit) {
                    logger.debug(`Skipping ${drug.name} - already configured`);
                    skippedCount++;
                    continue;
                }

                // Determine base unit
                const baseUnit = determineBaseUnit(drug);
                const displayUnit = getDefaultDisplayUnit(baseUnit);
                const conversion = getDefaultConversion(baseUnit, displayUnit);

                logger.info(`Processing: ${drug.name}`);
                logger.info(`  Form: ${drug.form || 'N/A'}`);
                logger.info(`  Base Unit: ${baseUnit}`);
                logger.info(`  Display Unit: ${displayUnit}`);
                logger.info(`  Conversion: 1 ${displayUnit} = ${conversion} ${baseUnit}`);

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
                    // Set base unit quantity = current quantity (1:1 for now)
                    // In production, you may need to multiply by conversion if quantityInStock was in display units
                    await prisma.inventoryBatch.update({
                        where: { id: batch.id },
                        data: {
                            baseUnitQuantity: batch.quantityInStock * conversion,
                            receivedUnit: displayUnit,
                            receivedQuantity: batch.quantityInStock,
                            baseUnitReserved: 0
                        }
                    });
                }

                updatedCount++;
                logger.info(`  ✓ Successfully migrated ${drug.name} and ${drug.inventory.length} batches\n`);

            } catch (error) {
                errorCount++;
                logger.error(`Error processing drug ${drug.id} (${drug.name}):`, error);
            }
        }

        logger.info('='.repeat(60));
        logger.info('Migration Summary');
        logger.info('='.repeat(60));
        logger.info(`Total Drugs: ${drugs.length}`);
        logger.info(`✓ Updated: ${updatedCount}`);
        logger.info(`⊘ Skipped: ${skippedCount}`);
        logger.info(`✗ Errors: ${errorCount}`);
        logger.info('='.repeat(60));

        if (errorCount === 0) {
            logger.info('✓ Migration completed successfully!');
        } else {
            logger.warn(`⚠️  Migration completed with ${errorCount} errors. Please review.`);
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
