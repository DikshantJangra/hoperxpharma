const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const cacheService = require('../services/cacheService');
const queueService = require('../services/queueService');

/**
 * Health Check Endpoint
 * Returns system health status and diagnostics
 */
router.get('/health', async (req, res) => {
    const startTime = Date.now();

    try {
        // Check database connection
        const dbHealthy = await checkDatabase();

        // Check cache service
        const cacheHealthy = await checkCache();

        // Check queue service  
        const queueHealthy = await checkQueues();

        const responseTime = Date.now() - startTime;

        const health = {
            status: dbHealthy && cacheHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: `${responseTime}ms`,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: {
                    status: dbHealthy ? 'up' : 'down',
                    type: 'postgresql'
                },
                cache: {
                    status: cacheHealthy ? 'up' : 'down',
                    type: cacheService.isRedisAvailable ? 'redis' : 'memory'
                },
                queues: {
                    status: queueHealthy ? 'up' : 'down',
                    available: queueService.isAvailable
                }
            },
            memory: {
                used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
            }
        };

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);

    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * Detailed health check (admin only)
 */
router.get('/health/detailed', async (req, res) => {
    try {
        const [dbHealth, cacheStats, queueStats] = await Promise.all([
            getDetailedDatabaseHealth(),
            cacheService.getStats(),
            queueService.getAllStats()
        ]);

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            cache: cacheStats,
            queues: queueStats,
            process: {
                pid: process.pid,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

// Helper functions
async function checkDatabase() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

async function checkCache() {
    try {
        if (cacheService.isRedisAvailable) {
            await cacheService.set('health-check', 'ok', 10);
            const value = await cacheService.get('health-check');
            return value === 'ok';
        }
        return true; // Memory cache always available
    } catch (error) {
        console.error('Cache health check failed:', error);
        return false;
    }
}

async function checkQueues() {
    try {
        if (!queueService.isAvailable) {
            return true; // Queues are optional
        }
        const stats = await queueService.getAllStats();
        return stats.available;
    } catch (error) {
        console.error('Queue health check failed:', error);
        return true; // Don't fail health check for queues
    }
}

async function getDetailedDatabaseHealth() {
    try {
        const result = await prisma.$queryRaw`
            SELECT 
                count(*) as connection_count,
                current_database() as database_name,
                version() as pg_version
        `;
        return {
            connected: true,
            ...result[0]
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message
        };
    }
}

module.exports = router;
