const auditRepository = require('../../repositories/auditRepository');

/**
 * Audit Service - Business logic for activity logging
 */
class AuditService {
    /**
     * Log an activity
     */
    async logActivity(activityData) {
        const { storeId, userId, action, entityType, entityId, changes, ipAddress } = activityData;

        // Validate required fields
        if (!storeId || !userId || !action || !entityType || !entityId) {
            throw new Error('Missing required fields for audit log');
        }

        return await auditRepository.createAuditLog({
            storeId,
            userId,
            action,
            entityType,
            entityId,
            changes: changes || {},
            ipAddress: ipAddress || null,
        });
    }

    /**
     * Get activity logs with filtering
     */
    async getActivityLogs(filters) {
        return await auditRepository.getAuditLogs(filters);
    }

    /**
     * Get activity log by ID
     */
    async getActivityById(id) {
        const log = await auditRepository.getAuditLogById(id);
        if (!log) {
            throw new Error('Activity log not found');
        }
        return log;
    }

    /**
     * Get activity logs for a specific entity
     */
    async getActivityByEntity(entityType, entityId, storeId) {
        return await auditRepository.getAuditLogsByEntity(entityType, entityId, storeId);
    }

    /**
     * Get activity statistics
     */
    async getActivityStats(storeId, startDate, endDate) {
        return await auditRepository.getAuditStats(storeId, startDate, endDate);
    }

    /**
     * Search activity logs
     */
    async searchActivities(storeId, searchQuery, limit = 50) {
        if (!searchQuery || searchQuery.trim().length === 0) {
            throw new Error('Search query is required');
        }
        return await auditRepository.searchAuditLogs(storeId, searchQuery, limit);
    }

    /**
     * Determine severity based on action
     */
    getSeverity(action) {
        const criticalActions = [
            'PATIENT_DELETED',
            'SALE_DELETED',
            'USER_DELETED',
            'PRESCRIPTION_DELETED',
            'INVENTORY_DELETED',
        ];
        const highActions = [
            'PATIENT_UPDATED',
            'SALE_REFUNDED',
            'INVENTORY_ADJUSTED',
            'USER_ROLE_CHANGED',
            'SUPPLIER_DELETED',
        ];
        const mediumActions = [
            'SALE_CREATED',
            'PRESCRIPTION_CREATED',
            'PURCHASE_ORDER_CREATED',
            'SUPPLIER_CREATED',
            'SUPPLIER_UPDATED',
        ];

        if (criticalActions.some((a) => action.includes(a))) return 'critical';
        if (highActions.some((a) => action.includes(a))) return 'high';
        if (mediumActions.some((a) => action.includes(a))) return 'medium';
        return 'low';
    }

    /**
     * Format audit log for display
     */
    formatAuditLog(log) {
        return {
            id: log.id,
            timestamp: log.createdAt,
            severity: this.getSeverity(log.action),
            actor: {
                id: log.user.id,
                name: `${log.user.firstName} ${log.user.lastName}`,
                email: log.user.email,
                role: log.user.role.toLowerCase(),
            },
            action: log.action,
            resource: {
                type: log.entityType,
                id: log.entityId,
            },
            summary: this.generateSummary(log),
            ip: log.ipAddress || 'N/A',
            location: 'Unknown', // Can be enhanced with IP geolocation
            tags: this.generateTags(log),
            changes: log.changes,
        };
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(log) {
        const userName = `${log.user.firstName} ${log.user.lastName}`;
        const action = log.action.toLowerCase().replace(/_/g, ' ');
        return `${userName} ${action} ${log.entityType} ${log.entityId}`;
    }

    /**
     * Generate tags for filtering
     */
    generateTags(log) {
        const tags = [log.entityType.toLowerCase()];
        if (log.action.includes('DELETE')) tags.push('deletion');
        if (log.action.includes('CREATE')) tags.push('creation');
        if (log.action.includes('UPDATE')) tags.push('modification');
        return tags;
    }
}

module.exports = new AuditService();
