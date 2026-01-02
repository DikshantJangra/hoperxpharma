const logger = require('../config/logger');

// Redis client instance (lazy-loaded)
let redisClient = null;
let Redis = null;

// Initialize Redis if enabled
const initRedis = () => {
    const isRedisEnabled = process.env.REDIS_ENABLED === 'true';
    const redisUrl = process.env.REDIS_URL;

    if (!isRedisEnabled || !redisUrl) {
        logger.info('Redis caching disabled or not configured. Using in-memory cache fallback.');
        return null;
    }

    try {
        Redis = require('redis');
        redisClient = Redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis unavailable');
                    }
                    return retries * 100;
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('Redis cache connected successfully');
        });

        redisClient.connect().catch((err) => {
            logger.error('Failed to connect to Redis:', err);
            redisClient = null;
        });

        return redisClient;
    } catch (error) {
        logger.warn('Redis packages not installed. Using in-memory cache.');
        return null;
    }
};

/**
 * Cache Service
 * Provides unified caching interface with Redis (if available) or in-memory fallback
 */
class CacheService {
    constructor() {
        this.memoryCache = new Map();
        this.memoryExpiry = new Map();
        this.client = null;
        this.isRedisAvailable = false;

        // Initialize Redis on construction
        this.init();
    }

    async init() {
        this.client = initRedis();
        this.isRedisAvailable = this.client !== null;

        // Cleanup expired memory cache entries every minute
        setInterval(() => this.cleanupMemoryCache(), 60000);
    }

    cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, expiry] of this.memoryExpiry.entries()) {
            if (expiry && expiry < now) {
                this.memoryCache.delete(key);
                this.memoryExpiry.delete(key);
            }
        }
    }

    /**
     * Get value from cache
     */
    async get(key) {
        try {
            if (this.isRedisAvailable && this.client) {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            }

            // Fallback to memory cache
            const expiry = this.memoryExpiry.get(key);
            if (expiry && expiry < Date.now()) {
                this.memoryCache.delete(key);
                this.memoryExpiry.delete(key);
                return null;
            }
            return this.memoryCache.get(key) || null;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set value in cache with optional TTL (in seconds)
     */
    async set(key, value, ttlSeconds = 300) {
        try {
            if (this.isRedisAvailable && this.client) {
                await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
                return true;
            }

            // Fallback to memory cache
            this.memoryCache.set(key, value);
            if (ttlSeconds) {
                this.memoryExpiry.set(key, Date.now() + (ttlSeconds * 1000));
            }
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete value from cache
     */
    async del(key) {
        try {
            if (this.isRedisAvailable && this.client) {
                await this.client.del(key);
            }
            this.memoryCache.delete(key);
            this.memoryExpiry.delete(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Delete multiple keys matching pattern
     */
    async delPattern(pattern) {
        try {
            if (this.isRedisAvailable && this.client) {
                const keys = await this.client.keys(pattern);
                if (keys.length > 0) {
                    await this.client.del(keys);
                }
            }

            // Fallback: delete from memory cache
            for (const key of this.memoryCache.keys()) {
                if (this.matchPattern(key, pattern)) {
                    this.memoryCache.delete(key);
                    this.memoryExpiry.delete(key);
                }
            }
            return true;
        } catch (error) {
            logger.error(`Cache delete pattern error for ${pattern}:`, error);
            return false;
        }
    }

    /**
     * Simple pattern matching for memory cache (supports * wildcard)
     */
    matchPattern(str, pattern) {
        const regexPattern = pattern.replace(/\*/g, '.*');
        return new RegExp(`^${regexPattern}$`).test(str);
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        try {
            if (this.isRedisAvailable && this.client) {
                return await this.client.exists(key) === 1;
            }
            return this.memoryCache.has(key);
        } catch (error) {
            logger.error(`Cache exists error for key ${key}:`, error);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            if (this.isRedisAvailable && this.client) {
                const info = await this.client.info('stats');
                return {
                    type: 'redis',
                    connected: true,
                    info: info
                };
            }

            return {
                type: 'memory',
                connected: true,
                size: this.memoryCache.size,
                keys: Array.from(this.memoryCache.keys())
            };
        } catch (error) {
            logger.error('Error getting cache stats:', error);
            return { type: 'unknown', connected: false };
        }
    }

    /**
     * Clear all cache
     */
    async flush() {
        try {
            if (this.isRedisAvailable && this.client) {
                await this.client.flushDb();
            }
            this.memoryCache.clear();
            this.memoryExpiry.clear();
            logger.info('Cache flushed successfully');
            return true;
        } catch (error) {
            logger.error('Error flushing cache:', error);
            return false;
        }
    }

    /**
     * Disconnect Redis client
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isRedisAvailable = false;
        }
    }

    // ======================
    // Application-specific cache helpers
    // ======================

    /**
     * Cache key generators
     */
    keys = {
        storeSettings: (storeId) => `store:${storeId}:settings`,
        storeFeatures: (storeId) => `store:${storeId}:features`,
        businessTypeFeatures: (businessType) => `businessType:${businessType}:features`,
        userPermissions: (userId) => `user:${userId}:permissions`,
        taxSlab: (id) => `taxSlab:${id}`,
        hsnCode: (code) => `hsn:${code}`,
        drugInfo: (drugId) => `drug:${drugId}:info`,
    };

    /**
     * Invalidation patterns
     */
    invalidate = {
        storeData: async (storeId) => {
            await this.delPattern(`store:${storeId}:*`);
            logger.info(`Invalidated cache for store: ${storeId}`);
        },
        userData: async (userId) => {
            await this.delPattern(`user:${userId}:*`);
            logger.info(`Invalidated cache for user: ${userId}`);
        },
        allFeatures: async () => {
            await this.delPattern('*:features');
            logger.info('Invalidated all feature caches');
        },
        gstData: async () => {
            await this.delPattern('taxSlab:*');
            await this.delPattern('hsn:*');
            logger.info('Invalidated GST cache');
        }
    };
}

module.exports = new CacheService();
