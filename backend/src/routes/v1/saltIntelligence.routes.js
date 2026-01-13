const express = require('express');
const prisma = require('../../db/prisma');
const auditService = require('../../services/auditService');
const ApiError = require('../../utils/ApiError');

const router = express.Router();

/**
 * GET /api/v1/salt-intelligence/stats
 * Get salt intelligence statistics for dashboard
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    // Get counts by status
    const [unmappedCount, pendingCount, activeCount, recentlyAdded, oldestPending] = await Promise.all([
      // Unmapped (SALT_PENDING + DRAFT)
      prisma.drug.count({
        where: {
          storeId,
          ingestionStatus: { in: ['SALT_PENDING', 'DRAFT'] },
          deletedAt: null,
        },
      }),

      // Pending
      prisma.drug.count({
        where: {
          storeId,
          ingestionStatus: 'SALT_PENDING',
          deletedAt: null,
        },
      }),

      // Active
      prisma.drug.count({
        where: {
          storeId,
          ingestionStatus: 'ACTIVE',
          deletedAt: null,
        },
      }),

      // Recently added (last 24 hours)
      prisma.drug.count({
        where: {
          storeId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          deletedAt: null,
        },
      }),

      // Oldest pending
      prisma.drug.findFirst({
        where: {
          storeId,
          ingestionStatus: 'SALT_PENDING',
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      }),
    ]);

    const stats = {
      unmappedCount,
      pendingCount,
      activeCount,
      recentlyAdded,
      oldestPending: oldestPending
        ? {
            drugId: oldestPending.id,
            name: oldestPending.name,
            daysPending: Math.floor(
              (Date.now() - oldestPending.createdAt.getTime()) / (1000 * 60 * 60 * 24)
            ),
          }
        : null,
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/salt-intelligence/audit
 * Get audit logs
 */
router.get('/audit', async (req, res, next) => {
  try {
    const { drugId, userId, startDate, endDate, limit, offset } = req.query;

    const logs = await auditService.queryLogs({
      drugId,
      userId,
      startDate,
      endDate,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/salt-intelligence/audit/export
 * Export audit logs to CSV
 */
router.get('/audit/export', async (req, res, next) => {
  try {
    const { drugId, userId, startDate, endDate } = req.query;

    const csv = await auditService.exportToCSV({
      drugId,
      userId,
      startDate,
      endDate,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/salt-intelligence/analytics
 * Get analytics data
 */
router.get('/analytics', async (req, res, next) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    if (!storeId) {
      throw ApiError.badRequest('storeId is required');
    }

    // Calculate analytics
    const [totalDrugs, activeDrugs, auditStats, topSalts] = await Promise.all([
      prisma.drug.count({
        where: { storeId, deletedAt: null },
      }),

      prisma.drug.count({
        where: { storeId, ingestionStatus: 'ACTIVE', deletedAt: null },
      }),

      auditService.getStatistics({ startDate, endDate }),

      prisma.drugSaltLink.groupBy({
        by: ['saltId'],
        _count: true,
        orderBy: {
          _count: {
            saltId: 'desc',
          },
        },
        take: 20,
      }),
    ]);

    const activePercentage = totalDrugs > 0 ? (activeDrugs / totalDrugs) * 100 : 0;

    // Get salt names for top salts
    const saltIds = topSalts.map((s) => s.saltId);
    const salts = await prisma.salt.findMany({
      where: { id: { in: saltIds } },
      select: { id: true, name: true },
    });

    const saltMap = new Map(salts.map((s) => [s.id, s.name]));
    const topSaltsWithNames = topSalts.map((s) => ({
      saltId: s.saltId,
      saltName: saltMap.get(s.saltId) || 'Unknown',
      count: s._count,
    }));

    res.json({
      activePercentage: Math.round(activePercentage * 100) / 100,
      totalDrugs,
      activeDrugs,
      auditStats,
      topSalts: topSaltsWithNames,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
