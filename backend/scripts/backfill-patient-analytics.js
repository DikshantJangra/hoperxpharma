/**
 * Backfill Patient Analytics
 * 
 * This script recalculates analytics for all existing patients
 * Run once after deploying the customer profile system upgrade
 * 
 * Usage: node scripts/backfill-patient-analytics.js
 */

const prisma = require('../src/config/database');
const patientService = require('../src/services/patients/patientService');
const logger = require('../src/config/logger');

async function backfillPatientAnalytics() {
    try {
        logger.info('🚀 Starting patient analytics backfill...');

        // Get all stores
        const stores = await prisma.store.findMany({
            select: { id: true, name: true }
        });

        logger.info(`Found ${stores.length} stores`);

        let totalProcessed = 0;
        let totalFailed = 0;

        for (const store of stores) {
            logger.info(`\n📍 Processing store: ${store.name} (${store.id})`);

            // Get all patients for this store (in batches)
            const batchSize = 100;
            let skip = 0;
            let hasMore = true;

            while (hasMore) {
                const patients = await prisma.patient.findMany({
                    where: {
                        storeId: store.id,
                        deletedAt: null
                    },
                    select: { id: true, firstName: true, lastName: true },
                    take: batchSize,
                    skip: skip
                });

                if (patients.length === 0) {
                    hasMore = false;
                    break;
                }

                logger.info(`  Processing batch: ${skip} - ${skip + patients.length}`);

                for (const patient of patients) {
                    try {
                        await patientService.recalculatePatientAnalytics(patient.id, store.id);
                        totalProcessed++;

                        if (totalProcessed % 10 === 0) {
                            process.stdout.write('.');
                        }
                    } catch (error) {
                        logger.error(`  ❌ Failed for patient ${patient.id} (${patient.firstName} ${patient.lastName}): ${error.message}`);
                        totalFailed++;
                    }
                }

                skip += batchSize;

                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            logger.info(`\n  ✓ Store complete`);
        }

        logger.info(`\n\n✅ Backfill complete!`);
        logger.info(`  Processed: ${totalProcessed} patients`);
        logger.info(`  Failed: ${totalFailed} patients`);

    } catch (error) {
        logger.error(`Fatal error during backfill: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
if (require.main === module) {
    backfillPatientAnalytics()
        .then(() => {
            logger.info('Script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = backfillPatientAnalytics;
