const behaviorRepository = require('../../repositories/behaviorRepository');
const barcodeRepository = require('../../repositories/barcodeRepository');
const alertService = require('../alertService');
const logger = require('../../config/logger');
const dayjs = require('dayjs');
const prisma = require('../../db/prisma');

/**
 * Behavioral Detection Service - Employee anomaly scoring and pattern detection
 * Implements the "silent red flags" system from Indian Pharmacy design
 */
class BehaviorDetectionService {
    /**
     * Calculate daily anomaly score for employee
     * This is the core behavioral analysis function
     */
    async calculateEmployeeAnomalyScore(employeeId, storeId, date) {
        const startOfDay = dayjs(date).startOf('day').toDate();
        const endOfDay = dayjs(date).endOf('day').toDate();

        logger.debug(`Calculating anomaly score for employee ${employeeId} on ${dayjs(date).format('YYYY-MM-DD')}`);

        // Gather all metrics in parallel
        const [
            totalSales,
            voidedSales,
            overrides,
            fefoDeviations,
            unscannedSales,
            scanCount
        ] = await Promise.all([
            this.getSalesCount(employeeId, storeId, startOfDay, endOfDay),
            this.getVoidCount(employeeId, storeId, startOfDay, endOfDay),
            this.getOverrideCount(employeeId, storeId, startOfDay, endOfDay),
            this.getFEFODeviationCount(employeeId, storeId, startOfDay, endOfDay),
            this.getUnscannedSalesCount(employeeId, storeId, startOfDay, endOfDay),
            this.getScanCount(employeeId, storeId, startOfDay, endOfDay)
        ]);

        // Avoid division by zero
        const safeTotalSales = Math.max(totalSales, 1);

        // Calculate rates (percentages)
        const manualEntryRate = parseFloat(((unscannedSales / safeTotalSales) * 100).toFixed(2));
        const voidRate = parseFloat(((voidedSales / safeTotalSales) * 100).toFixed(2));
        const overrideRate = parseFloat(((overrides / safeTotalSales) * 100).toFixed(2));
        const fefoDeviationRate = parseFloat(((fefoDeviations / safeTotalSales) * 100).toFixed(2));
        const scanRate = parseFloat(((scanCount / safeTotalSales) * 100).toFixed(2));

        // Get peer average for comparison
        const peerAverage = await this.getPeerAverage(storeId, date);

        // Calculate composite anomaly score
        const anomalyScore = this.computeAnomalyScore({
            manualEntryRate,
            voidRate,
            overrideRate,
            fefoDeviationRate,
            scanRate
        }, peerAverage);

        // Prepare metrics object
        const metrics = {
            scanBypassCount: unscannedSales,
            voidCount: voidedSales,
            overrideCount: overrides,
            fefoDeviationCount: fefoDeviations,
            manualEntryCount: unscannedSales,
            totalSalesCount: totalSales,
            manualEntryRate,
            anomalyScore: parseFloat(anomalyScore)
        };

        // Save to database
        await behaviorRepository.upsertDailyMetric(employeeId, storeId, date, metrics);

        logger.debug(`Anomaly score for employee ${employeeId}: ${anomalyScore}`);

        // Create alert if score is high
        if (parseFloat(anomalyScore) > 70) {
            await this.createHighAnomalyAlert(employeeId, storeId, metrics);
        }

        return metrics;
    }

    /**
     * Compute composite anomaly score using weighted algorithm
     */
    computeAnomalyScore(metrics, peerAverage) {
        // Weights for different metrics (must sum to 1.0)
        const weights = {
            manualEntryRate: 0.30,      // Most important: indicates scan bypass
            voidRate: 0.25,             // High voids = potential billing manipulation
            overrideRate: 0.25,         // Overrides = bypassing system controls
            fefoDeviationRate: 0.20     // FEFO violations = inventory mismanagement
        };

        let score = 0;

        // For each metric, calculate deviation from peer average
        Object.keys(weights).forEach(metric => {
            const employeeValue = metrics[metric] || 0;
            const peerValue = peerAverage[metric] || 0;

            // Deviation from peer (positive = worse than peers)
            const deviation = employeeValue - peerValue;

            // Convert deviation to 0-100 score
            // Higher deviation = higher score (worse)
            const metricScore = Math.max(0, Math.min(100, deviation * 2));

            score += metricScore * weights[metric];
        });

        return Math.min(100, score).toFixed(2);
    }

    /**
     * Get peer average metrics for a store on a specific date
     */
    async getPeerAverage(storeId, date) {
        const metrics = await behaviorRepository.getStoreMetrics(storeId, date);

        // If no data, return safe defaults
        if (metrics.length === 0) {
            return {
                manualEntryRate: 20,
                voidRate: 2,
                overrideRate: 5,
                fefoDeviationRate: 10,
                scanRate: 80
            };
        }

        // Calculate store averages
        const totals = metrics.reduce((acc, m) => {
            acc.manualEntryRate += m.manualEntryRate;
            acc.voidCount += m.voidCount;
            acc.overrideCount += m.overrideCount;
            acc.fefoDeviationCount += m.fefoDeviationCount;
            acc.totalSalesCount += m.totalSalesCount;
            return acc;
        }, {
            manualEntryRate: 0,
            voidCount: 0,
            overrideCount: 0,
            fefoDeviationCount: 0,
            totalSalesCount: 0
        });

        const count = metrics.length;
        const avgTotalSales = Math.max(totals.totalSalesCount / count, 1);

        return {
            manualEntryRate: parseFloat((totals.manualEntryRate / count).toFixed(2)),
            voidRate: parseFloat((totals.voidCount / avgTotalSales * 100).toFixed(2)),
            overrideRate: parseFloat((totals.overrideCount / avgTotalSales * 100).toFixed(2)),
            fefoDeviationRate: parseFloat((totals.fefoDeviationCount / avgTotalSales * 100).toFixed(2)),
            scanRate: 80 // Default assumption
        };
    }

    /**
     * Create high anomaly alert
     */
    async createHighAnomalyAlert(employeeId, storeId, metrics) {
        await alertService.createAutomatedAlert({
            storeId,
            type: 'BEHAVIORAL',
            severity: 'HIGH',
            title: 'High Employee Anomaly Score',
            description: `Employee behavioral score: ${metrics.anomalyScore}/100. ` +
                `Manual entry: ${metrics.manualEntryRate}%, Voids: ${metrics.voidCount}, ` +
                `Overrides: ${metrics.overrideCount}`,
            source: 'BEHAVIOR_MONITOR',
            relatedType: 'employee',
            relatedId: employeeId,
            metadata: {
                employeeId,
                ...metrics
            }
        });
    }

    // ========== Helper Methods to Gather Metrics ==========

    async getSalesCount(employeeId, storeId, startDate, endDate) {
        return await prisma.sale.count({
            where: {
                soldBy: employeeId,
                storeId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'COMPLETED'
            }
        });
    }

    async getVoidCount(employeeId, storeId, startDate, endDate) {
        return await prisma.sale.count({
            where: {
                soldBy: employeeId,
                storeId,
                createdAt: { gte: startDate, lte: endDate },
                status: 'CANCELLED'
            }
        });
    }

    async getOverrideCount(employeeId, storeId, startDate, endDate) {
        return await behaviorRepository.countOverrides(
            employeeId,
            storeId,
            startDate,
            endDate
        );
    }

    async getFEFODeviationCount(employeeId, storeId, startDate, endDate) {
        return await behaviorRepository.countFEFODeviations(
            employeeId,
            storeId,
            startDate,
            endDate
        );
    }

    async getUnscannedSalesCount(employeeId, storeId, startDate, endDate) {
        return await prisma.saleItem.count({
            where: {
                sale: {
                    soldBy: employeeId,
                    storeId,
                    createdAt: { gte: startDate, lte: endDate }
                },
                scanned: false
            }
        });
    }

    async getScanCount(employeeId, storeId, startDate, endDate) {
        return await barcodeRepository.getEmployeeScanCount(
            employeeId,
            startDate,
            endDate,
            'SALE'
        );
    }

    /**
     * Get employee behavioral summary for date range
     */
    async getEmployeeBehaviorSummary(employeeId, storeId, days = 30) {
        const endDate = new Date();
        const startDate = dayjs().subtract(days, 'days').toDate();

        const metrics = await behaviorRepository.getEmployeeMetrics(
            employeeId,
            startDate,
            endDate
        );

        if (metrics.length === 0) {
            return null;
        }

        // Calculate averages
        const totals = metrics.reduce((acc, m) => {
            acc.anomalyScore += m.anomalyScore;
            acc.manualEntryRate += m.manualEntryRate;
            acc.voidCount += m.voidCount;
            acc.overrideCount += m.overrideCount;
            acc.totalSalesCount += m.totalSalesCount;
            return acc;
        }, {
            anomalyScore: 0,
            manualEntryRate: 0,
            voidCount: 0,
            overrideCount: 0,
            totalSalesCount: 0
        });

        const count = metrics.length;

        return {
            employeeId,
            period: { days, startDate, endDate },
            averageAnomalyScore: parseFloat((totals.anomalyScore / count).toFixed(2)),
            averageManualEntryRate: parseFloat((totals.manualEntryRate / count).toFixed(2)),
            totalVoids: totals.voidCount,
            totalOverrides: totals.overrideCount,
            totalSales: totals.totalSalesCount,
            daysAnalyzed: count,
            dailyMetrics: metrics.map(m => ({
                date: m.date,
                anomalyScore: m.anomalyScore,
                manualEntryRate: m.manualEntryRate,
                voidCount: m.voidCount,
                overrideCount: m.overrideCount
            }))
        };
    }

    /**
     * Get store-wide behavioral insights
     */
    async getStoreBehavioralInsights(storeId, days = 7) {
        const endDate = new Date();
        const startDate = dayjs().subtract(days, 'days').toDate();

        // Get latest metrics for all employees
        const today = dayjs().startOf('day').toDate();
        const employeeMetrics = await behaviorRepository.getStoreMetrics(storeId, today);

        // Get high anomaly employees
        const highAnomalyEmployees = await behaviorRepository.getHighAnomalyEmployees(
            storeId,
            70,
            10
        );

        return {
            storeId,
            period: { days, startDate, endDate },
            totalEmployeesTracked: employeeMetrics.length,
            highRiskEmployees: highAnomalyEmployees.length,
            storeAverageAnomalyScore: employeeMetrics.length > 0
                ? parseFloat((employeeMetrics.reduce((sum, m) => sum + m.anomalyScore, 0) / employeeMetrics.length).toFixed(2))
                : 0,
            highRiskList: highAnomalyEmployees.map(m => ({
                employeeId: m.employeeId,
                anomalyScore: m.anomalyScore,
                manualEntryRate: m.manualEntryRate,
                voidCount: m.voidCount,
                overrideCount: m.overrideCount,
                date: m.date
            }))
        };
    }
}

module.exports = new BehaviorDetectionService();
