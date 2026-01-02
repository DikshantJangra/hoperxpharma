const express = require('express');
const router = express.Router();
const cacheService = require('../services/cache/cacheService');
const { authenticate } = require('../middlewares/auth');
const logger = require('../config/logger');

/**
 * Cache Management Routes
 * Protected routes for cache administration
 */

/**
 * Get cache statistics
 * GET /api/v1/cache/stats
 */
router.get('/stats', authenticate, (req, res) => {
    try {
        const stats = cacheService.getCacheStats();

        res.json({
            success: true,
            data: {
                drugs: {
                    keys: stats.drugs.keys,
                    hits: stats.drugs.hits,
                    misses: stats.drugs.misses,
                    hitRate: stats.drugs.hits / (stats.drugs.hits + stats.drugs.misses) || 0,
                },
                permissions: {
                    keys: stats.permissions.keys,
                    hits: stats.permissions.hits,
                    misses: stats.permissions.misses,
                    hitRate: stats.permissions.hits / (stats.permissions.hits + stats.permissions.misses) || 0,
                },
                stores: {
                    keys: stats.stores.keys,
                    hits: stats.stores.hits,
                    misses: stats.misses,
                    hitRate: stats.stores.hits / (stats.stores.hits + stats.stores.misses) || 0,
                },
                general: {
                    keys: stats.general.keys,
                    hits: stats.general.hits,
                    misses: stats.general.misses,
                    hitRate: stats.general.hits / (stats.general.hits + stats.general.misses) || 0,
                },
            },
        });
    } catch (error) {
        logger.error('Cache stats error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to get cache statistics',
        });
    }
});

/**
 * Clear all caches
 * POST /api/v1/cache/clear
 */
router.post('/clear', authenticate, (req, res) => {
    try {
        // Only admins can clear cache
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Only admins can clear cache',
            });
        }

        cacheService.clearAllCaches();

        logger.info('All caches cleared', { userId: req.user.id });

        res.json({
            success: true,
            message: 'All caches cleared successfully',
        });
    } catch (error) {
        logger.error('Cache clear error', { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Failed to clear caches',
        });
    }
});

/**
 * Clear specific cache
 * POST /api/v1/cache/clear/:type
 */
router.post('/clear/:type', authenticate, (req, res) => {
    try {
        const { type } = req.params;

        // Only admins can clear cache
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Only admins can clear cache',
            });
        }

        switch (type) {
            case 'drugs':
                cacheService.drug.clear();
                break;
            case 'permissions':
                cacheService.permission.clear();
                break;
            case 'stores':
                cacheService.store.clear();
                break;
            case 'general':
                cacheService.general.clear();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid cache type',
                });
        }

        logger.info(`${type} cache cleared`, { userId: req.user.id });

        res.json({
            success: true,
            message: `${type} cache cleared successfully`,
        });
    } catch (error) {
        logger.error('Cache clear error', { error: error.message, type: req.params.type });
        res.status(500).json({
            success: false,
            error: 'Failed to clear cache',
        });
    }
});

module.exports = router;
