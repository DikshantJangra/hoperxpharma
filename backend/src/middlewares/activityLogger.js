const logger = require('../config/logger');
const prisma = require('../db/prisma');

/**
 * Comprehensive Activity Logging Middleware
 * Logs all user actions for behavioral analysis
 */

const LOGGED_ACTIONS = {
    // Sales & POS
    SALE_CREATED: 'SALE_CREATED',
    SALE_VOIDED: 'SALE_VOIDED',
    SALE_ITEM_ADDED: 'SALE_ITEM_ADDED',
    MANUAL_ENTRY: 'MANUAL_ENTRY',
    BARCODE_SCANNED: 'BARCODE_SCANNED',

    // Overrides
    PRICE_OVERRIDE: 'PRICE_OVERRIDE',
    BATCH_OVERRIDE: 'BATCH_OVERRIDE',
    FEFO_OVERRIDE: 'FEFO_OVERRIDE',
    DISCOUNT_OVERRIDE: 'DISCOUNT_OVERRIDE',

    // Inventory
    STOCK_ADJUSTED: 'STOCK_ADJUSTED',
    BATCH_CREATED: 'BATCH_CREATED',
    LOCATION_CHANGED: 'LOCATION_CHANGED',

    // Authentication
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',

    // Prescriptions
    PRESCRIPTION_DISPENSED: 'PRESCRIPTION_DISPENSED',
    PRESCRIPTION_VOIDED: 'PRESCRIPTION_VOIDED'
};

/**
 * Log user activity
 */
async function logActivity({
    userId,
    storeId,
    action,
    entityType,
    entityId,
    metadata = {},
    ipAddress,
    userAgent
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                storeId,
                action,
                entityType,
                entityId,
                changes: null,
                metadata: {
                    ...metadata,
                    ipAddress,
                    userAgent,
                    timestamp: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        logger.error('Failed to log activity:', error);
        // Don't throw - logging failures shouldn't break the application
    }
}

/**
 * Express middleware to automatically log requests
 */
function activityLogger(req, res, next) {
    // Store original res.json to intercept responses
    const originalJson = res.json.bind(res);

    res.json = function (body) {
        // Log after successful response
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const userId = req.user?.id;
            const storeId = req.user?.storeId;

            if (userId && storeId) {
                // Determine action from route and method
                const action = determineAction(req);

                if (action) {
                    logActivity({
                        userId,
                        storeId,
                        action,
                        entityType: getEntityType(req),
                        entityId: getEntityId(req, body),
                        metadata: {
                            method: req.method,
                            path: req.path,
                            body: req.body,
                            query: req.query
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent')
                    }).catch(err => logger.error('Activity logging error:', err));
                }
            }
        }

        return originalJson(body);
    };

    next();
}

/**
 * Determine action from request
 */
function determineAction(req) {
    const { method, path } = req;

    // Sales
    if (path.includes('/sales') && method === 'POST') return LOGGED_ACTIONS.SALE_CREATED;
    if (path.includes('/sales') && method === 'DELETE') return LOGGED_ACTIONS.SALE_VOIDED;

    // Scan
    if (path.includes('/scan/process')) return LOGGED_ACTIONS.BARCODE_SCANNED;

    // FEFO
    if (path.includes('/fefo/deviation')) return LOGGED_ACTIONS.FEFO_OVERRIDE;

    // Inventory
    if (path.includes('/inventory/adjust')) return LOGGED_ACTIONS.STOCK_ADJUSTED;
    if (path.includes('/inventory/batches') && method === 'POST') return LOGGED_ACTIONS.BATCH_CREATED;

    // Auth
    if (path.includes('/auth/login')) return LOGGED_ACTIONS.LOGIN_SUCCESS;
    if (path.includes('/auth/logout')) return LOGGED_ACTIONS.LOGOUT;

    return null;
}

/**
 * Get entity type from request
 */
function getEntityType(req) {
    if (req.path.includes('/sales')) return 'sale';
    if (req.path.includes('/inventory')) return 'inventory';
    if (req.path.includes('/prescription')) return 'prescription';
    return 'unknown';
}

/**
 * Extract entity ID from request or response
 */
function getEntityId(req, responseBody) {
    // Try params first
    if (req.params.id) return req.params.id;

    // Try response body
    if (responseBody && responseBody.data && responseBody.data.id) {
        return responseBody.data.id;
    }

    return null;
}

/**
 * Standalone logger for manual use
 */
async function logUserAction(action, userId, storeId, metadata = {}) {
    return await logActivity({
        userId,
        storeId,
        action,
        entityType: metadata.entityType || 'unknown',
        entityId: metadata.entityId || null,
        metadata
    });
}

module.exports = {
    activityLogger,
    logActivity,
    logUserAction,
    LOGGED_ACTIONS
};
