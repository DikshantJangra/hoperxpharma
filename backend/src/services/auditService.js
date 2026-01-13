const saltMappingAuditRepository = require('../repositories/saltMappingAuditRepository');
const logger = require('../config/logger');

/**
 * Audit Service
 * 
 * Manages audit logging for salt mapping changes.
 * Validates: Requirements 9.1, 9.2, 9.3, 9.6
 */
class AuditService {
    /**
     * Log salt mapping creation
     * @param {Object} data - Audit data
     * @returns {Promise<Object>} Created audit log
     */
    async logCreation(data) {
        const { drugId, userId, newValue, ocrConfidence, wasAutoMapped } = data;

        try {
            const auditLog = await saltMappingAuditRepository.createAuditLog({
                drugId,
                userId,
                action: 'CREATED',
                oldValue: null,
                newValue,
                ocrConfidence,
                wasAutoMapped
            });

            logger.info(`Audit log created for drug ${drugId}: CREATED`);
            return auditLog;
        } catch (error) {
            logger.error(`Failed to create audit log for drug ${drugId}:`, error);
            throw error;
        }
    }

    /**
     * Log salt mapping update
     * @param {Object} data - Audit data
     * @returns {Promise<Object>} Created audit log
     */
    async logUpdate(data) {
        const { drugId, userId, oldValue, newValue, ocrConfidence, wasAutoMapped } = data;

        try {
            const auditLog = await saltMappingAuditRepository.createAuditLog({
                drugId,
                userId,
                action: 'UPDATED',
                oldValue,
                newValue,
                ocrConfidence,
                wasAutoMapped
            });

            logger.info(`Audit log created for drug ${drugId}: UPDATED`);
            return auditLog;
        } catch (error) {
            logger.error(`Failed to create audit log for drug ${drugId}:`, error);
            throw error;
        }
    }

    /**
     * Log salt mapping deletion
     * @param {Object} data - Audit data
     * @returns {Promise<Object>} Created audit log
     */
    async logDeletion(data) {
        const { drugId, userId, oldValue } = data;

        try {
            const auditLog = await saltMappingAuditRepository.createAuditLog({
                drugId,
                userId,
                action: 'DELETED',
                oldValue,
                newValue: null
            });

            logger.info(`Audit log created for drug ${drugId}: DELETED`);
            return auditLog;
        } catch (error) {
            logger.error(`Failed to create audit log for drug ${drugId}:`, error);
            throw error;
        }
    }

    /**
     * Log bulk correction operation
     * @param {Object} data - Bulk operation data
     * @returns {Promise<Array>} Created audit logs
     */
    async logBulkCorrection(data) {
        const { userId, updates, batchId } = data;

        try {
            const auditLogs = await Promise.all(
                updates.map(update =>
                    saltMappingAuditRepository.createAuditLog({
                        drugId: update.drugId,
                        userId,
                        action: 'UPDATED',
                        batchId,
                        oldValue: update.oldValue,
                        newValue: update.newValue
                    })
                )
            );

            logger.info(`Bulk audit logs created: ${auditLogs.length} entries (batch: ${batchId})`);
            return auditLogs;
        } catch (error) {
            logger.error(`Failed to create bulk audit logs:`, error);
            throw error;
        }
    }

    /**
     * Get audit history for a drug
     * @param {string} drugId - Drug ID
     * @param {number} limit - Maximum number of logs
     * @returns {Promise<Array>} Audit logs
     */
    async getDrugHistory(drugId, limit = 50) {
        return await saltMappingAuditRepository.getByDrugId(drugId, limit);
    }

    /**
     * Get audit history for a user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of logs
     * @returns {Promise<Array>} Audit logs
     */
    async getUserHistory(userId, limit = 50) {
        return await saltMappingAuditRepository.getByUserId(userId, limit);
    }

    /**
     * Get audit logs for a batch operation
     * @param {string} batchId - Batch ID
     * @returns {Promise<Array>} Audit logs
     */
    async getBatchHistory(batchId) {
        return await saltMappingAuditRepository.getByBatchId(batchId);
    }

    /**
     * Query audit logs with filters
     * @param {Object} filters - Query filters
     * @returns {Promise<Array>} Audit logs
     */
    async queryLogs(filters) {
        return await saltMappingAuditRepository.queryAuditLogs(filters);
    }

    /**
     * Export audit logs to CSV
     * @param {Object} filters - Query filters
     * @returns {Promise<string>} CSV string
     */
    async exportToCSV(filters = {}) {
        return await saltMappingAuditRepository.exportToCSV(filters);
    }

    /**
     * Get audit statistics
     * @param {Object} filters - Query filters
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics(filters = {}) {
        return await saltMappingAuditRepository.getStatistics(filters);
    }
}

module.exports = new AuditService();
