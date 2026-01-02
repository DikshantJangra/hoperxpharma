const logger = require('../config/logger');

/**
 * Geolocation Service - IP to location lookup using FreeIPAPI
 * 
 * Features:
 * - 24h caching per IP
 * - Rate limiting (60 requests/min)
 * - Graceful fallbacks
 * - No retries on failure
 */

const cache = new Map();
const rateLimiter = {
    requests: [],
    maxPerMinute: 58, // Safety buffer below 60
};

/**
 * Validate IP address format
 */
function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;

    // Skip localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127')) {
        return false;
    }

    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
        const parts = ip.split('.');
        return parts.every(part => parseInt(part) <= 255);
    }

    // Accept IPv6 (basic check)
    return ip.includes(':');
}

/**
 * Check rate limit (60 requests per minute)
 */
function checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    rateLimiter.requests = rateLimiter.requests.filter(time => time > oneMinuteAgo);

    // Check if under limit
    if (rateLimiter.requests.length >= rateLimiter.maxPerMinute) {
        return false;
    }

    return true;
}

/**
 * Record API request for rate limiting
 */
function recordRequest() {
    rateLimiter.requests.push(Date.now());
}

/**
 * Get cached geolocation data
 */
function getFromCache(ip) {
    const cached = cache.get(`geo:${ip}`);
    if (!cached) return null;

    // Check if expired
    if (Date.now() > cached.expiry) {
        cache.delete(`geo:${ip}`);
        return null;
    }

    return cached.data;
}

/**
 * Store in cache with 24h TTL
 */
function setInCache(ip, data) {
    const ttl = 86400000; // 24 hours in ms
    cache.set(`geo:${ip}`, {
        data,
        expiry: Date.now() + ttl,
    });
}

/**
 * Lookup IP geolocation using FreeIPAPI
 * 
 * @param {string} ip - IP address to lookup
 * @returns {Promise<object|null>} Geolocation data or null
 */
async function lookupIP(ip) {
    // 1. Validate IP
    if (!isValidIP(ip)) {
        return null;
    }

    // 2. Check cache
    const cached = getFromCache(ip);
    if (cached) {
        return cached;
    }

    // 3. Check rate limit
    if (!checkRateLimit()) {
        return null;
    }

    // 4. Call FreeIPAPI
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // 2s timeout

        recordRequest();

        const response = await fetch(
            `https://free.freeipapi.com/api/json/${ip}`,
            {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            logger.error(`[Geolocation] API error for ${ip}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        // 5. Validate and normalize response
        const geoData = {
            ipAddress: data.ipAddress || ip,
            countryCode: data.countryCode || null,
            countryName: data.countryName || null,
            regionName: data.regionName || null,
            cityName: data.cityName || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            timeZone: data.timeZone || null,
            asn: data.asn || null,
            isp: data.isp || null,
        };

        // Store in cache
        setInCache(ip, geoData);

        return geoData;

    } catch (error) {
        if (error.name === 'AbortError') {
            logger.error(`[Geolocation] Timeout for ${ip}`);
        } else {
            logger.error(`[Geolocation] Error for ${ip}:`, error.message);
        }
        return null;
    }
}

/**
 * Get cache statistics (for monitoring)
 */
function getCacheStats() {
    return {
        size: cache.size,
        requestsLastMinute: rateLimiter.requests.length,
        rateLimit: rateLimiter.maxPerMinute,
    };
}

/**
 * Clear expired cache entries (cleanup)
 */
function cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of cache.entries()) {
        if (now > value.expiry) {
            cache.delete(key);
            cleaned++;
        }
    }
}

// Run cleanup every hour
setInterval(cleanupCache, 3600000);

module.exports = {
    lookupIP,
    getCacheStats,
    cleanupCache,
};
