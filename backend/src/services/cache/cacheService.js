const NodeCache = require('node-cache');
const logger = require('../../config/logger');

/**
 * Cache Service
 * In-memory caching for frequently accessed data
 * 
 * TTL (Time To Live):
 * - Drug catalog: 10 minutes (600s)
 * - User permissions: 5 minutes (300s)
 * - Store settings: 15 minutes (900s)
 * - Default: 5 minutes (300s)
 */

// Initialize cache instances
const drugCache = new NodeCache({
    stdTTL: 600,  // 10 minutes
    checkperiod: 120,  // Check for expired keys every 2 minutes
    useClones: false,  // Better performance, use with caution
});

const permissionCache = new NodeCache({
    stdTTL: 300,  // 5 minutes
    checkperiod: 60,
    useClones: false,
});

const storeCache = new NodeCache({
    stdTTL: 900,  // 15 minutes
    checkperiod: 180,
    useClones: false,
});

const generalCache = new NodeCache({
    stdTTL: 300,  // 5 minutes
    checkperiod: 60,
    useClones: false,
});

/**
 * Cache statistics for monitoring
 */
const getCacheStats = () => {
    return {
        drugs: drugCache.getStats(),
        permissions: permissionCache.getStats(),
        stores: storeCache.getStats(),
        general: generalCache.getStats(),
    };
};

/**
 * Drug Cache Methods
 */
const drugCacheService = {
    get: (drugId) => {
        const key = `drug:${drugId}`;
        const cached = drugCache.get(key);
        if (cached) {
            logger.debug('Cache HIT', { key });
        } else {
            logger.debug('Cache MISS', { key });
        }
        return cached;
    },

    set: (drugId, drugData, ttl = 600) => {
        const key = `drug:${drugId}`;
        drugCache.set(key, drugData, ttl);
        logger.debug('Cache SET', { key, ttl });
    },

    invalidate: (drugId) => {
        const key = `drug:${drugId}`;
        drugCache.del(key);
        logger.debug('Cache INVALIDATE', { key });
    },

    clear: () => {
        drugCache.flushAll();
        logger.info('Drug cache cleared');
    },
};

/**
 * Permission Cache Methods
 */
const permissionCacheService = {
    get: (userId) => {
        const key = `permissions:${userId}`;
        return permissionCache.get(key);
    },

    set: (userId, permissions, ttl = 300) => {
        const key = `permissions:${userId}`;
        permissionCache.set(key, permissions, ttl);
        logger.debug('Permissions cached', { userId });
    },

    invalidate: (userId) => {
        const key = `permissions:${userId}`;
        permissionCache.del(key);
        logger.debug('Permissions cache invalidated', { userId });
    },

    clear: () => {
        permissionCache.flushAll();
        logger.info('Permission cache cleared');
    },
};

/**
 * Store Cache Methods
 */
const storeCacheService = {
    get: (storeId) => {
        const key = `store:${storeId}`;
        return storeCache.get(key);
    },

    set: (storeId, storeData, ttl = 900) => {
        const key = `store:${storeId}`;
        storeCache.set(key, storeData, ttl);
        logger.debug('Store cached', { storeId });
    },

    invalidate: (storeId) => {
        const key = `store:${storeId}`;
        storeCache.del(key);
        logger.debug('Store cache invalidated', { storeId });
    },

    clear: () => {
        storeCache.flushAll();
        logger.info('Store cache cleared');
    },
};

/**
 * General Cache Methods
 */
const generalCacheService = {
    get: (key) => generalCache.get(key),
    set: (key, value, ttl) => generalCache.set(key, value, ttl),
    invalidate: (key) => generalCache.del(key),
    clear: () => generalCache.flushAll(),
};

/**
 * Clear all caches
 */
const clearAllCaches = () => {
    drugCache.flushAll();
    permissionCache.flushAll();
    storeCache.flushAll();
    generalCache.flushAll();
    logger.info('All caches cleared');
};

// Event listeners for cache events
drugCache.on('expired', (key, value) => {
    logger.debug('Drug cache key expired', { key });
});

permissionCache.on('expired', (key, value) => {
    logger.debug('Permission cache key expired', { key });
});

module.exports = {
    drug: drugCacheService,
    permission: permissionCacheService,
    store: storeCacheService,
    general: generalCacheService,
    getCacheStats,
    clearAllCaches,
};
