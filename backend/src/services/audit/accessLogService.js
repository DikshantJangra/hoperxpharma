const accessLogRepository = require('../../repositories/accessLogRepository');
const logger = require('../../config/logger');
const geolocationService = require('../geolocationService');

/**
 * Access Log Service - Business logic for access logging
 */
class AccessLogService {
    /**
     * Log an access event (login, logout, etc.)
     */
    async logAccess({ userId, eventType, ipAddress, userAgent, deviceInfo }) {
        try {
            // Lookup geolocation for the IP (async, cached for 24h)
            let geolocation = null;
            try {
                logger.info('[AccessLog] Looking up geolocation for IP:', ipAddress);
                geolocation = await geolocationService.lookupIP(ipAddress);
                logger.info('[AccessLog] Geolocation result:', geolocation);
            } catch (geoError) {
                // Don't fail the log creation if geolocation fails
                logger.error('Geolocation lookup failed:', geoError);
            }

            const result = await accessLogRepository.createAccessLog({
                userId,
                eventType,
                ipAddress,
                userAgent: userAgent || null,
                deviceInfo: deviceInfo || null,
                geolocation, // Can be null
            });

            logger.info('[AccessLog] Created with geolocation:', result.geolocation ? 'YES' : 'NO');
            return result;
        } catch (error) {
            logger.error('[AccessLogService] Error logging access:', error);
            throw error;
        }
    }

    /**
     * Get access logs with filtering
     */
    async getAccessLogs(filters) {
        return await accessLogRepository.getAccessLogs(filters);
    }

    /**
     * Get access log by ID
     */
    async getAccessById(id) {
        const log = await accessLogRepository.getAccessLogById(id);
        if (!log) {
            throw new Error('Access log not found');
        }
        return log;
    }

    /**
     * Get access statistics
     */
    async getAccessStats(storeId, startDate, endDate) {
        return await accessLogRepository.getAccessStats(storeId, startDate, endDate);
    }

    /**
     * Detect suspicious activities
     */
    async detectSuspiciousActivity() {
        const suspicious = await accessLogRepository.getSuspiciousActivities();

        return suspicious.map((activity) => ({
            userId: activity.userId,
            ipAddress: activity.ipAddress,
            failedAttempts: activity._count.id,
            severity: activity._count.id >= 5 ? 'critical' : 'high',
            recommendation: activity._count.id >= 5
                ? 'Consider blocking this IP address'
                : 'Monitor for additional failed attempts',
        }));
    }

    /**
     * Get failed login attempts for a user
     */
    async getFailedAttempts(userId, hours = 24) {
        const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        return await accessLogRepository.getFailedAttempts(userId, sinceDate);
    }

    /**
     * Get access logs by user
     */
    async getAccessByUser(userId, limit = 50) {
        return await accessLogRepository.getAccessLogsByUser(userId, limit);
    }

    /**
     * Search access logs
     */
    async searchAccessLogs(storeId, searchQuery, limit = 50) {
        if (!searchQuery || searchQuery.trim().length === 0) {
            throw new Error('Search query is required');
        }
        return await accessLogRepository.searchAccessLogs(storeId, searchQuery, limit);
    }

    /**
     * Format access log for display
     */
    formatAccessLog(log) {
        return {
            id: log.id,
            timestamp: log.createdAt,
            user: {
                id: log.user.id,
                name: `${log.user.firstName} ${log.user.lastName}`,
                email: log.user.email,
                role: log.user.role.toLowerCase(),
            },
            eventType: log.eventType,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            deviceInfo: log.deviceInfo,
            geolocation: log.geolocation, // Include geolocation data
            status: this.getEventStatus(log.eventType),
            risk: this.calculateRisk(log),
        };
    }

    /**
     * Get event status (success/failure)
     */
    getEventStatus(eventType) {
        if (eventType.includes('success')) return 'success';
        if (eventType.includes('failure')) return 'failed';
        if (eventType.includes('blocked')) return 'blocked';
        if (eventType.includes('challenge')) return 'challenged';
        return 'unknown';
    }

    /**
     * Calculate risk level
     */
    calculateRisk(log) {
        if (log.eventType === 'login_failure') return 'medium';
        if (log.eventType.includes('blocked')) return 'high';
        if (log.eventType.includes('suspicious')) return 'critical';
        return 'low';
    }
}

module.exports = new AccessLogService();
