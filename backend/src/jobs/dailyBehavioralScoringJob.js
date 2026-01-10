const cron = require('node-cron');
const behaviorDetectionService = require('../services/behavioral/behaviorDetectionService');
const prisma = require('../db/prisma');
const logger = require('../config/logger');
const dayjs = require('dayjs');

/**
 * Daily Behavioral Scoring Job
 * Runs every day at 1:00 AM to calculate anomaly scores for all employees
 */

let isRunning = false;

async function runDailyBehavioralScoring() {
    if (isRunning) {
        logger.warn('[BehavioralScoring] Job already running, skipping...');
        return;
    }

    isRunning = true;
    const yesterday = dayjs().subtract(1, 'day').toDate();

    try {
        logger.info(`[BehavioralScoring] Starting daily behavioral scoring for ${dayjs(yesterday).format('YYYY-MM-DD')}`);

        // Get all active stores
        const stores = await prisma.store.findMany({
            where: {
                deletedAt: null
            },
            select: { id: true, name: true }
        });

        logger.info(`[BehavioralScoring] Processing ${stores.length} stores`);

        let totalEmployees = 0;
        let highAnomalyCount = 0;

        for (const store of stores) {
            try {
                // Get all employees for this store
                const storeUsers = await prisma.storeUser.findMany({
                    where: {
                        storeId: store.id
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                isActive: true
                            }
                        }
                    }
                });

                logger.info(`[BehavioralScoring] Processing ${storeUsers.length} employees for store ${store.name}`);

                for (const { user } of storeUsers) {
                    if (!user.isActive) {
                        continue;
                    }

                    try {
                        // Calculate anomaly score for yesterday
                        const metrics = await behaviorDetectionService.calculateEmployeeAnomalyScore(
                            user.id,
                            store.id,
                            yesterday
                        );

                        totalEmployees++;

                        if (metrics.anomalyScore > 70) {
                            highAnomalyCount++;
                            logger.warn(
                                `[BehavioralScoring] ⚠️ High anomaly: ${user.firstName} ${user.lastName} ` +
                                `(Score: ${metrics.anomalyScore})`
                            );
                        }

                    } catch (error) {
                        logger.error(
                            `[BehavioralScoring] Error calculating score for user ${user.id}:`,
                            error.message
                        );
                    }
                }

            } catch (error) {
                logger.error(
                    `[BehavioralScoring] Error processing store ${store.id}:`,
                    error.message
                );
            }
        }

        logger.info(
            `[BehavioralScoring] ✅ Completed scoring for ${totalEmployees} employees. ` +
            `${highAnomalyCount} high-risk employees detected.`
        );

    } catch (error) {
        logger.error('[BehavioralScoring] ❌ Fatal error in daily behavioral scoring:', error);
    } finally {
        isRunning = false;
    }
}

/**
 * Schedule the job to run daily at 1:00 AM
 * Cron format: minute hour day month weekday
 * '0 1 * * *' = At 1:00 AM every day
 */
function startDailyBehavioralScoringJob() {
    logger.info('[BehavioralScoring] Scheduling daily behavioral scoring job (1:00 AM daily)');

    cron.schedule('0 1 * * *', async () => {
        logger.info('[BehavioralScoring] Cron trigger: Starting daily behavioral scoring');
        await runDailyBehavioralScoring();
    });

    logger.info('[BehavioralScoring] ✅ Daily behavioral scoring job scheduled');
}

/**
 * Manual trigger (for testing or on-demand execution)
 */
async function triggerManualScoring() {
    logger.info('[BehavioralScoring] Manual trigger requested');
    await runDailyBehavioralScoring();
}

module.exports = {
    startDailyBehavioralScoringJob,
    triggerManualScoring
};
