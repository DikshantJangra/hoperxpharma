
const eventBus = require('../events/eventBus');
const { INVENTORY_EVENTS } = require('../events/eventTypes');
const logger = require('../config/logger');

const prisma = require('../db/prisma');

/**
 * Low Stock Check Job - Scans drugs for low stock levels
 * Runs every 6 hours
 * 
 * WORKER SAFETY RULES:
 * - Processes stores in batches
 * - Fails gracefully per-store
 * - Uses indexed queries only
 * - Emits events, doesn't create alerts directly
 */

const MAX_STORES_PER_RUN = 100; // Process max 100 stores per run

async function runLowStockCheck() {
    const startTime = Date.now();
    let storesProcessed = 0;
    let eventsEmitted = 0;

    try {
        logger.debug('[LowStockCheck] Starting low stock check job...');

        // Get active stores with batch limit
        const stores = await prisma.store.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                settings: {
                    select: {
                        lowStockThreshold: true,
                    },
                },
            },
            take: MAX_STORES_PER_RUN,
        });

        logger.debug(`[LowStockCheck] Processing ${stores.length} stores`);

        for (const store of stores) {
            try {
                const lowStockThreshold = store.settings?.lowStockThreshold || 10;

                // Efficient aggregation query - leverages indexes
                const drugs = await prisma.drug.findMany({
                    where: {
                        storeId: store.id,
                    },
                    include: {
                        inventory: {
                            where: {
                                deletedAt: null,
                                quantityInStock: { gt: 0 },
                            },
                            select: {
                                quantityInStock: true,
                            },
                        },
                    },
                });

                for (const drug of drugs) {
                    const totalStock = drug.inventory.reduce((sum, b) => sum + b.quantityInStock, 0);

                    // Only emit if below threshold (de-duplication handled by rule engine)
                    if (totalStock < lowStockThreshold && totalStock >= 0) {
                        eventBus.emitEvent(INVENTORY_EVENTS.LOW_STOCK, {
                            storeId: store.id,
                            entityType: 'drug',
                            entityId: drug.id,
                            drugName: drug.name,
                            currentStock: totalStock,
                            reorderLevel: lowStockThreshold,
                            deficit: lowStockThreshold - totalStock,
                        });
                        eventsEmitted++;
                    }
                }

                storesProcessed++;
            } catch (storeError) {
                // Log and continue - one store failure doesn't break entire job
                logger.error(`[LowStockCheck] Error processing store ${store.id}:`, storeError);
            }
        }

        const duration = Date.now() - startTime;
        logger.debug(`[LowStockCheck] Completed: ${storesProcessed} stores processed, ${eventsEmitted} events emitted in ${duration}ms`);

    } catch (error) {
        logger.error('[LowStockCheck] Fatal error in low stock check job:', error);
    }
}

module.exports = { runLowStockCheck };
