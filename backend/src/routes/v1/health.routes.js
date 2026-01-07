const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = require('../../db/prisma');
const logger = require('../../config/logger');

/**
 * Health Check Routes
 * 
 * /ping - Fast health check (no dependencies)
 * /health - Comprehensive health check (includes DB, memory, external services)
 */

/**
 * Ping - Ultra-fast health check
 * Used by load balancers for traffic routing
 * GET /api/v1/health/ping
 */
router.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

/**
 * Comprehensive Health Check
 * Used for monitoring and diagnostics
 * GET /api/v1/health
 */
router.get('/', async (req, res) => {
    const startTime = Date.now();

    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        checks: {},
    };

    // 1. Database Health
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1 as health_check`;
        const dbDuration = Date.now() - dbStart;

        health.checks.database = {
            status: 'healthy',
            responseTime: `${dbDuration}ms`,
            connection: 'active',
        };
    } catch (error) {
        health.status = 'unhealthy';
        health.checks.database = {
            status: 'unhealthy',
            error: error.message,
        };
        logger.error('Database health check failed', { error: error.message });
    }

    // 2. Memory Usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    health.checks.memory = {
        status: heapUsagePercent < 90 ? 'healthy' : 'warning',
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        heapUsagePercent: `${heapUsagePercent}%`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    };

    if (heapUsagePercent >= 90) {
        health.status = 'warning';
        logger.warn('High memory usage detected', { heapUsagePercent });
    }

    // 3. External Services (optional checks)
    // These are commented out to avoid slowing down health checks
    // Uncomment if you need to monitor external service connectivity

    /*
    // WhatsApp API (if configured)
    if (process.env.PLATFORM_WA_ACCESS_TOKEN) {
      try {
        // Lightweight check - just verify token format
        health.checks.whatsapp = {
          status: 'configured',
          note: 'Token present, connectivity not verified',
        };
      } catch (error) {
        health.checks.whatsapp = {
          status: 'error',
          error: error.message,
        };
      }
    }
    
    // Email Service (if configured)
    if (process.env.SMTP_HOST) {
      health.checks.email = {
        status: 'configured',
        host: process.env.SMTP_HOST,
      };
    }
    */

    // 4. Overall Response Time
    const totalDuration = Date.now() - startTime;
    health.responseTime = `${totalDuration}ms`;

    // Determine HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 503;

    res.status(statusCode).json(health);
});

/**
 * Readiness Check
 * Returns 200 only if app is ready to serve traffic
 * GET /api/v1/health/ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            reason: 'Database not available',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * Liveness Check
 * Returns 200 if process is alive (even if unhealthy)
 * Used by Kubernetes/Docker to know if container should be restarted
 * GET /api/v1/health/live
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid,
    });
});

module.exports = router;
