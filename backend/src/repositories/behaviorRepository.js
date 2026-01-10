const prisma = require('../db/prisma');
const dayjs = require('dayjs');

/**
 * Behavior Repository - Data access layer for employee behavioral tracking
 */
class BehaviorRepository {
    /**
     * Upsert daily behavior metric for employee
     */
    async upsertDailyMetric(employeeId, storeId, date, metrics) {
        const dateOnly = dayjs(date).startOf('day').toDate();

        return await prisma.employeeBehaviorMetric.upsert({
            where: {
                employeeId_storeId_date: {
                    employeeId,
                    storeId,
                    date: dateOnly
                }
            },
            create: {
                employeeId,
                storeId,
                date: dateOnly,
                ...metrics
            },
            update: metrics
        });
    }

    /**
     * Get employee metrics for date range
     */
    async getEmployeeMetrics(employeeId, startDate, endDate) {
        return await prisma.employeeBehaviorMetric.findMany({
            where: {
                employeeId,
                date: {
                    gte: dayjs(startDate).startOf('day').toDate(),
                    lte: dayjs(endDate).endOf('day').toDate()
                }
            },
            orderBy: { date: 'desc' }
        });
    }

    /**
     * Get today's metrics for employee
     */
    async getTodayMetrics(employeeId, storeId) {
        const today = dayjs().startOf('day').toDate();

        return await prisma.employeeBehaviorMetric.findUnique({
            where: {
                employeeId_storeId_date: {
                    employeeId,
                    storeId,
                    date: today
                }
            }
        });
    }

    /**
     * Get all employees with high anomaly scores
     */
    async getHighAnomalyEmployees(storeId, threshold = 70, limit = 10) {
        const today = dayjs().startOf('day').toDate();

        return await prisma.employeeBehaviorMetric.findMany({
            where: {
                storeId,
                date: today,
                anomalyScore: { gte: threshold }
            },
            orderBy: { anomalyScore: 'desc' },
            take: limit
        });
    }

    /**
     * Get store-wide metrics for a date
     */
    async getStoreMetrics(storeId, date) {
        const dateOnly = dayjs(date).startOf('day').toDate();

        return await prisma.employeeBehaviorMetric.findMany({
            where: {
                storeId,
                date: dateOnly
            },
            orderBy: { anomalyScore: 'desc' }
        });
    }

    /**
     * Log operation override
     */
    async logOverride(overrideData) {
        return await prisma.operationOverride.create({
            data: overrideData
        });
    }

    /**
     * Get override history
     */
    async getOverrideHistory(filters) {
        const { employeeId, storeId, overrideType, startDate, endDate, limit = 100 } = filters;

        const where = {
            ...(employeeId && { employeeId }),
            ...(storeId && { storeId }),
            ...(overrideType && { overrideType }),
            ...(startDate && endDate && {
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            })
        };

        return await prisma.operationOverride.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: limit
        });
    }

    /**
     * Count overrides for employee in date range
     */
    async countOverrides(employeeId, storeId, startDate, endDate, overrideType = null) {
        const where = {
            employeeId,
            storeId,
            timestamp: {
                gte: startDate,
                lte: endDate
            },
            ...(overrideType && { overrideType })
        };

        return await prisma.operationOverride.count({ where });
    }

    /**
     * Log FEFO deviation
     */
    async logFEFODeviation(deviationData) {
        return await prisma.fefoDeviation.create({
            data: deviationData
        });
    }

    /**
     * Get FEFO deviation history
     */
    async getFEFODeviations(filters) {
        const { employeeId, drugId, storeId, startDate, endDate, limit = 100 } = filters;

        const where = {
            ...(employeeId && { employeeId }),
            ...(drugId && { drugId }),
            ...(storeId && { storeId }),
            ...(startDate && endDate && {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            })
        };

        return await prisma.fefoDeviation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Count FEFO deviations
     */
    async countFEFODeviations(employeeId, storeId, startDate, endDate) {
        return await prisma.fefoDeviation.count({
            where: {
                employeeId,
                storeId,
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
    }

    /**
     * Calculate peer average metrics for a store
     */
    async calculatePeerAverage(storeId, date) {
        const dateOnly = dayjs(date).startOf('day').toDate();

        const metrics = await prisma.employeeBehaviorMetric.findMany({
            where: {
                storeId,
                date: dateOnly
            }
        });

        if (metrics.length === 0) {
            return {
                manualEntryRate: 20,
                voidRate: 2,
                overrideRate: 5,
                fefoDeviationRate: 10,
                anomalyScore: 30
            };
        }

        const totals = metrics.reduce((acc, m) => {
            acc.manualEntryRate += m.manualEntryRate;
            acc.voidCount += m.voidCount;
            acc.overrideCount += m.overrideCount;
            acc.fefoDeviationCount += m.fefoDeviationCount;
            acc.totalSalesCount += m.totalSalesCount;
            acc.anomalyScore += m.anomalyScore;
            return acc;
        }, {
            manualEntryRate: 0,
            voidCount: 0,
            overrideCount: 0,
            fefoDeviationCount: 0,
            totalSalesCount: 0,
            anomalyScore: 0
        });

        const count = metrics.length;
        const avgTotalSales = totals.totalSalesCount / count || 1;

        return {
            manualEntryRate: parseFloat((totals.manualEntryRate / count).toFixed(2)),
            voidRate: parseFloat((totals.voidCount / avgTotalSales * 100).toFixed(2)),
            overrideRate: parseFloat((totals.overrideCount / avgTotalSales * 100).toFixed(2)),
            fefoDeviationRate: parseFloat((totals.fefoDeviationCount / avgTotalSales * 100).toFixed(2)),
            anomalyScore: parseFloat((totals.anomalyScore / count).toFixed(2))
        };
    }
}

module.exports = new BehaviorRepository();
