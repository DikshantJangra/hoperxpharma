const logger = require('../config/logger');

/**
 * Simple in-memory cache with TTL support
 * Can be replaced with Redis in production
 */
class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();

        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if not found/expired
     */
    get(key) {
        // Check if key exists and is not expired
        if (this.cache.has(key)) {
            const expiresAt = this.ttls.get(key);

            if (expiresAt && Date.now() > expiresAt) {
                // Expired, remove it
                this.cache.delete(key);
                this.ttls.delete(key);
                logger.debug(`Cache expired: ${key}`);
                return null;
            }

            logger.debug(`Cache hit: ${key}`);
            return this.cache.get(key);
        }

        logger.debug(`Cache miss: ${key}`);
        return null;
    }

    /**
     * Set value in cache with TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
     */
    set(key, value, ttlSeconds = 3600) {
        this.cache.set(key, value);

        if (ttlSeconds > 0) {
            const expiresAt = Date.now() + (ttlSeconds * 1000);
            this.ttls.set(key, expiresAt);
        }

        logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     */
    delete(key) {
        const existed = this.cache.has(key);
        this.cache.delete(key);
        this.ttls.delete(key);

        if (existed) {
            logger.debug(`Cache deleted: ${key}`);
        }

        return existed;
    }

    /**
     * Delete all keys matching a pattern
     * @param {string} pattern - Pattern to match (supports wildcards with *)
     */
    deletePattern(pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        let deletedCount = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                this.ttls.delete(key);
                deletedCount++;
            }
        }

        if (deletedCount > 0) {
            logger.debug(`Cache pattern deleted: ${pattern} (${deletedCount} keys)`);
        }

        return deletedCount;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.ttls.clear();
        logger.info(`Cache cleared: ${size} entries removed`);
    }

    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, expiresAt] of this.ttls.entries()) {
            if (now > expiresAt) {
                this.cache.delete(key);
                this.ttls.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.debug(`Cache cleanup: ${cleanedCount} expired entries removed`);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Shutdown cache service
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
        logger.info('Cache service shutdown');
    }

    // CRITICAL FIX: Add keys helper for structured cache keys
    keys = {
        storeSettings: (storeId) => `store:${storeId}:settings`,
        storeDrugs: (storeId) => `store:${storeId}:drugs`,
        drugStock: (drugId) => `drug:${drugId}:stock`,
        userPermissions: (userId) => `user:${userId}:permissions`,
    };

    // CRITICAL FIX: Add invalidate helper for clearing store-related cache
    invalidate = {
        storeData: async (storeId) => {
            this.deletePattern(`store:${storeId}:*`);
        },
        drugData: async (drugId) => {
            this.deletePattern(`drug:${drugId}:*`);
        },
        userData: async (userId) => {
            this.deletePattern(`user:${userId}:*`);
        }
    };

    // Alias for backward compatibility
    flush = () => this.clear();
}

// Export singleton instance
module.exports = new CacheService();
