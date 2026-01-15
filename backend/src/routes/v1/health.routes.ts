/**
 * Health Check Routes
 * 
 * Production-grade health checks for monitoring and load balancers
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { typesenseClient } from '../../lib/typesense/client';
import { metrics } from '../../lib/metrics';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /health
 * Basic health check - returns 200 if service is up
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /health/ready
 * Readiness check - returns 200 if service is ready to accept traffic
 * Checks database and search engine connectivity
 */
router.get('/ready', async (req, res) => {
  const checks: Record<string, any> = {
    database: { status: 'unknown' },
    search: { status: 'unknown' },
  };

  let isReady = true;

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy' };
  } catch (error: any) {
    checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
    isReady = false;
  }

  // Check Typesense
  try {
    await typesenseClient.health.retrieve();
    checks.search = { status: 'healthy' };
  } catch (error: any) {
    checks.search = {
      status: 'unhealthy',
      error: error.message,
    };
    isReady = false;
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json({
    status: isReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/live
 * Liveness check - returns 200 if service is alive
 * Used by Kubernetes to restart unhealthy pods
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/metrics
 * Metrics endpoint for monitoring
 */
router.get('/metrics', async (req, res) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Get aggregated metrics
  const searchMetrics = metrics.getAggregated('medicine.search.duration', oneHourAgo);
  const recentMetrics = metrics.getMetrics(oneHourAgo);

  // Count by type
  const metricCounts: Record<string, number> = {};
  recentMetrics.forEach((m) => {
    metricCounts[m.name] = (metricCounts[m.name] || 0) + 1;
  });

  // Database stats
  let dbStats: any = {};
  try {
    const [medicineCount, overlayCount, pendingCount] = await Promise.all([
      prisma.medicineMaster.count(),
      prisma.storeOverlay.count(),
      prisma.pendingMedicine.count({ where: { status: 'PENDING' } }),
    ]);

    dbStats = {
      medicines: medicineCount,
      overlays: overlayCount,
      pendingReview: pendingCount,
    };
  } catch (error) {
    dbStats = { error: 'Failed to fetch database stats' };
  }

  // Search stats
  let searchStats: any = {};
  try {
    const collection = await typesenseClient.collections('medicines').retrieve();
    searchStats = {
      documents: collection.num_documents,
    };
  } catch (error) {
    searchStats = { error: 'Failed to fetch search stats' };
  }

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbStats,
    search: searchStats,
    performance: {
      search: {
        count: searchMetrics.count,
        avgDuration: Math.round(searchMetrics.avg),
        minDuration: Math.round(searchMetrics.min),
        maxDuration: Math.round(searchMetrics.max),
      },
    },
    metrics: metricCounts,
  });
});

export default router;
