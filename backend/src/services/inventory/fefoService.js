const inventoryRepository = require('../../repositories/inventoryRepository');
const behaviorRepository = require('../../repositories/behaviorRepository');
const alertService = require('../alertService');
const logger = require('../../config/logger');
const dayjs = require('dayjs');
const prisma = require('../../db/prisma');

/**
 * FEFO Service - First Expiry First Out logic with deviation tracking
 * Implements logical FEFO (not enforced) as per Indian Pharmacy System design
 */
class FEFOService {
    /**
     * Get recommended batch using FEFO logic
     * Returns the batch with nearest expiry that has sufficient stock
     */
    async recommendBatch(drugId, storeId, quantity = 1) {
        logger.debug(`FEFO: Recommending batch for drug ${drugId}, quantity ${quantity}`);

        // Get all batches sorted by expiry (FEFO)
        const batches = await inventoryRepository.findBatchesForDispense(storeId, drugId, 10000);

        if (batches.length === 0) {
            return null;
        }

        // Filter out deleted and out-of-stock batches
        const availableBatches = batches.filter(b =>
            !b.deletedAt &&
            b.baseUnitQuantity > 0
        );

        if (availableBatches.length === 0) {
            return null;
        }

        // Find first batch with sufficient stock
        const recommended = availableBatches.find(b => b.baseUnitQuantity >= quantity);

        // If no single batch has enough, recommend the oldest anyway
        const finalRecommendation = recommended || availableBatches[0];

        const result = {
            recommendedBatchId: finalRecommendation.id,
            batchNumber: finalRecommendation.batchNumber,
            expiryDate: finalRecommendation.expiryDate,
            baseUnitQuantity: finalRecommendation.baseUnitQuantity,
            mrp: finalRecommendation.mrp,
            daysToExpiry: dayjs(finalRecommendation.expiryDate).diff(dayjs(), 'days'),
            alternativeBatches: availableBatches.slice(0, 5).map((b, index) => ({
                id: b.id,
                batchNumber: b.batchNumber,
                expiryDate: b.expiryDate,
                mrp: b.mrp,
                daysToExpiry: dayjs(b.expiryDate).diff(dayjs(), 'days'),
                daysDifferenceFromRecommended: dayjs(b.expiryDate).diff(
                    dayjs(finalRecommendation.expiryDate),
                    'days'
                ),
                isRecommended: index === 0
            })),
            expiryRisk: this.calculateExpiryRisk(availableBatches)
        };

        logger.debug(`FEFO: Recommended batch ${result.batchNumber} (expires in ${result.daysToExpiry} days)`);
        return result;
    }

    /**
     * Log FEFO deviation when employee chooses different batch
     */
    async logDeviation({
        saleId,
        saleItemId,
        drugId,
        recommendedBatchId,
        actualBatchId,
        employeeId,
        storeId,
        reason = 'No reason provided'
    }) {
        // Skip if same batch (no deviation)
        if (recommendedBatchId === actualBatchId) {
            return null;
        }

        // Get batch details to calculate deviation
        const [recommended, actual] = await Promise.all([
            inventoryRepository.findBatchById(recommendedBatchId),
            inventoryRepository.findBatchById(actualBatchId)
        ]);

        if (!recommended || !actual) {
            logger.warn(`FEFO: Could not log deviation - batch not found`);
            return null;
        }

        // Calculate deviation in days (positive = chose newer batch)
        const deviationDays = dayjs(actual.expiryDate).diff(
            dayjs(recommended.expiryDate),
            'days'
        );

        // Log deviation to database
        const deviation = await behaviorRepository.logFEFODeviation({
            saleId,
            saleItemId,
            drugId,
            recommendedBatchId,
            actualBatchId,
            deviationDays,
            employeeId,
            storeId,
            reason
        });

        logger.info(
            `⚠️ FEFO Deviation: Employee ${employeeId} chose batch ${deviationDays} days newer ` +
            `(Recommended: ${recommended.batchNumber}, Actual: ${actual.batchNumber})`
        );

        // Check if employee has pattern of deviations (background check)
        this.checkDeviationPattern(employeeId, storeId).catch(err =>
            logger.error('FEFO: Error checking deviation pattern:', err)
        );

        return deviation;
    }

    /**
     * Calculate expiry risk score for batches
     */
    calculateExpiryRisk(batches) {
        const now = dayjs();

        let totalRisk = 0;
        let riskCategories = {
            expired: 0,
            critical: 0,    // < 30 days
            warning: 0,     // 30-60 days
            caution: 0,     // 60-90 days
            safe: 0         // > 90 days
        };

        batches.forEach(batch => {
            const daysToExpiry = dayjs(batch.expiryDate).diff(now, 'days');
            const value = Number(batch.baseUnitQuantity) * Number(batch.mrp);

            // Categorize by expiry
            if (daysToExpiry < 0) {
                riskCategories.expired++;
                totalRisk += value;
            } else if (daysToExpiry <= 30) {
                riskCategories.critical++;
                totalRisk += value * 0.9;
            } else if (daysToExpiry <= 60) {
                riskCategories.warning++;
                totalRisk += value * 0.7;
            } else if (daysToExpiry <= 90) {
                riskCategories.caution++;
                totalRisk += value * 0.5;
            } else {
                riskCategories.safe++;
            }
        });

        return {
            totalAtRisk: parseFloat(totalRisk.toFixed(2)),
            categories: riskCategories,
            batchesExpiringSoon: riskCategories.critical + riskCategories.warning,
            totalBatches: batches.length
        };
    }

    /**
     * Check if employee has deviation pattern (async background check)
     */
    async checkDeviationPattern(employeeId, storeId) {
        const startDate = dayjs().subtract(7, 'days').toDate();
        const endDate = new Date();

        const deviationCount = await behaviorRepository.countFEFODeviations(
            employeeId,
            storeId,
            startDate,
            endDate
        );

        // Threshold: > 10 deviations in past week
        if (deviationCount > 10) {
            logger.warn(`🚨 High FEFO deviation count for employee ${employeeId}: ${deviationCount} in past 7 days`);

            // Create behavioral alert
            await alertService.createAutomatedAlert({
                storeId,
                type: 'BEHAVIORAL',
                severity: 'MEDIUM',
                title: 'Frequent FEFO Deviations Detected',
                description: `Employee has ${deviationCount} FEFO deviations in past 7 days`,
                source: 'FEFO_MONITOR',
                relatedType: 'employee',
                relatedId: employeeId,
                metadata: {
                    deviationCount,
                    period: '7 days',
                    employeeId
                }
            });
        }
    }

    /**
     * Get FEFO adherence statistics for store or employee
     */
    async getAdherenceStats(storeId, startDate, endDate, employeeId = null) {
        const where = {
            sale: {
                storeId,
                createdAt: { gte: startDate, lte: endDate },
                ...(employeeId && { soldBy: employeeId })
            }
        };

        const [totalSales, deviations] = await Promise.all([
            prisma.saleItem.count({ where }),
            behaviorRepository.getFEFODeviations({
                storeId,
                startDate,
                endDate,
                ...(employeeId && { employeeId })
            })
        ]);

        const adherenceRate = totalSales > 0
            ? ((totalSales - deviations.length) / totalSales * 100).toFixed(2)
            : 100;

        return {
            totalSales,
            deviations: deviations.length,
            adherenceRate: parseFloat(adherenceRate),
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            ...(employeeId && { employeeId })
        };
    }

    /**
     * Get top FEFO violators for a store
     */
    async getTopViolators(storeId, days = 30, limit = 10) {
        const startDate = dayjs().subtract(days, 'days').toDate();
        const endDate = new Date();

        const deviations = await behaviorRepository.getFEFODeviations({
            storeId,
            startDate,
            endDate,
            limit: 1000
        });

        // Group by employee
        const employeeStats = {};
        deviations.forEach(d => {
            if (!employeeStats[d.employeeId]) {
                employeeStats[d.employeeId] = {
                    employeeId: d.employeeId,
                    deviationCount: 0,
                    totalDeviationDays: 0,
                    averageDeviationDays: 0
                };
            }
            employeeStats[d.employeeId].deviationCount++;
            employeeStats[d.employeeId].totalDeviationDays += d.deviationDays;
        });

        // Calculate averages and sort
        const violators = Object.values(employeeStats)
            .map(stat => ({
                ...stat,
                averageDeviationDays: parseFloat(
                    (stat.totalDeviationDays / stat.deviationCount).toFixed(1)
                )
            }))
            .sort((a, b) => b.deviationCount - a.deviationCount)
            .slice(0, limit);

        return violators;
    }

    /**
     * Get FEFO violation trends over time
     */
    async getViolationTrends(storeId, days = 30) {
        const endDate = new Date();
        const startDate = dayjs().subtract(days, 'days').toDate();

        const deviations = await behaviorRepository.getFEFODeviations({
            storeId,
            startDate,
            endDate,
            limit: 10000
        });

        // Group by day
        const dailyStats = {};
        deviations.forEach(d => {
            const day = dayjs(d.createdAt).format('YYYY-MM-DD');
            if (!dailyStats[day]) {
                dailyStats[day] = 0;
            }
            dailyStats[day]++;
        });

        return Object.entries(dailyStats).map(([date, count]) => ({
            date,
            deviationCount: count
        })).sort((a, b) => a.date.localeCompare(b.date));
    }
}

module.exports = new FEFOService();
