const accessLogRepository = require('../../repositories/accessLogRepository');

/**
 * Access Log Service - Business logic for access logging
 */
class AccessLogService {
    /**
     * Log an access event
     */
    async logAccess(accessData) {
        const { userId, eventType, ipAddress, userAgent, deviceInfo } = accessData;

        // Validate required fields
        if (!userId || !eventType || !ipAddress) {
            throw new Error('Missing required fields for access log');
        }

        return await accessLogRepository.createAccessLog({
            userId,
            eventType,
            ipAddress,
            userAgent: userAgent || null,
            deviceInfo: deviceInfo || null,
        });
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
    async getAccessStats(startDate, endDate) {
        return await accessLogRepository.getAccessStats(startDate, endDate);
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
    async searchAccessLogs(searchQuery, limit = 50) {
        if (!searchQuery || searchQuery.trim().length === 0) {
            throw new Error('Search query is required');
        }
        return await accessLogRepository.searchAccessLogs(searchQuery, limit);
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
