const database = require('../config/database');
const eventBus = require('../events/eventBus');
const { INVENTORY_EVENTS } = require('../events/eventTypes');
const logger = require('../config/logger');

const prisma = database.getClient();

/**
 * Expiry Check Job - Scans all batches for expirations
 * Runs daily to detect batches approaching expiry
 * 
 * WORKER SAFETY RULES:
 * - Idempotent (safe to re-run)
 * - Hard limit per run (prevents runaway queries)
 * - Event emission only (no direct alert creation)
 * - Failure tolerant (logs errors, continues processing)
 */

const BATCH_SIZE = 500; // Process max 500 batches per run
const EXPIRY_WINDOW_DAYS = 90; // Check batches expiring within 90 days

async function runExpiryCheck() {
    const startTime = Date.now();
    let processedCount = 0;
    let eventsEmitted = 0;

    try {
        logger.info('[ExpiryCheck] Starting batch expiry check job...');

        const now = new Date();
        const in90Days = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

        // Query with hard limit for safety
        const batches = await prisma.inventoryBatch.findMany({
            where: {
                expiryDate: {
                    lte: in90Days,
                },
                quantityInStock: {
                    gt: 0, // Only batches with stock
                },
                deletedAt: null,
            },
            include: {
                drug: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            take: BATCH_SIZE, // Hard limit
            orderBy: {
                expiryDate: 'asc', // Check soonest expiry first
            },
        });

        logger.info(`[ExpiryCheck] Found ${batches.length} batches to check`);
        processedCount = batches.length;

        // Process batches - failure on one doesn't stop others
        for (const batch of batches) {
            try {
                const expiryDate = new Date(batch.expiryDate);
                const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

                // Emit appropriate event (rule engine decides if alert should be created)
                if (daysLeft <= 0) {
                    eventBus.emitEvent(INVENTORY_EVENTS.EXPIRED, {
                        storeId: batch.storeId,
                        entityType: 'batch',
                        entityId: batch.id,
                        drugId: batch.drugId,
                        drugName: batch.drug.name,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate,
                        quantityInStock: batch.quantityInStock,
                        mrp: batch.mrp,
                    });
                    eventsEmitted++;
                } else {
                    eventBus.emitEvent(INVENTORY_EVENTS.EXPIRY_NEAR, {
                        storeId: batch.storeId,
                        entityType: 'batch',
                        entityId: batch.id,
                        drugId: batch.drugId,
                        drugName: batch.drug.name,
                        batchNumber: batch.batchNumber,
                        expiryDate: batch.expiryDate,
                        daysLeft,
                        quantityInStock: batch.quantityInStock,
                        mrp: batch.mrp,
                    });
                    eventsEmitted++;
                }
            } catch (batchError) {
                // Log and continue - one failure doesn't break entire job
                logger.error(`[ExpiryCheck] Error processing batch ${batch.id}:`, batchError);
            }
        }

        const duration = Date.now() - startTime;
        logger.info(`[ExpiryCheck] Completed: ${processedCount} batches processed, ${eventsEmitted} events emitted in ${duration}ms`);

    } catch (error) {
        logger.error('[ExpiryCheck] Fatal error in expiry check job:', error);
        // Don't throw - cron will retry anyway
    }
}

module.exports = { runExpiryCheck };
