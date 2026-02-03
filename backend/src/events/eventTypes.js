/**
 * Event Type Constants
 * Define all system events for type safety and consistency
 */

// ============================================================================
// INVENTORY EVENTS
// ============================================================================

const INVENTORY_EVENTS = {
    // Batch expiry alerts
    EXPIRY_NEAR: 'INVENTORY.EXPIRY_NEAR', // Batch approaching expiry (within threshold)
    EXPIRED: 'INVENTORY.EXPIRED', // Batch has expired

    // Stock level alerts
    LOW_STOCK: 'INVENTORY.LOW_STOCK', // Stock below reorder level
    OUT_OF_STOCK: 'INVENTORY.OUT_OF_STOCK', // Stock depleted
    DEAD_STOCK: 'INVENTORY.DEAD_STOCK', // No movement for extended period

    // Batch events
    BATCH_CREATED: 'INVENTORY.BATCH_CREATED',
    BATCH_UPDATED: 'INVENTORY.BATCH_UPDATED',
    BATCH_DELETED: 'INVENTORY.BATCH_DELETED',
};

// ============================================================================
// SECURITY/AUTH EVENTS
// ============================================================================

const AUTH_EVENTS = {
    // Login events
    NEW_DEVICE_LOGIN: 'AUTH.NEW_DEVICE_LOGIN', // Login from new device/location
    FAILED_LOGIN_ATTEMPTS: 'AUTH.FAILED_LOGIN_ATTEMPTS', // Multiple failed attempts
    PASSWORD_CHANGED: 'AUTH.PASSWORD_CHANGED',

    // Access events
    ROLE_CHANGED: 'AUTH.ROLE_CHANGED',
    PERMISSION_CHANGED: 'AUTH.PERMISSION_CHANGED',
    STAFF_ADDED: 'AUTH.STAFF_ADDED',
    STAFF_REMOVED: 'AUTH.STAFF_REMOVED',
};

// ============================================================================
// PATIENT EVENTS (Phase 2)
// ============================================================================

const PATIENT_EVENTS = {
    REFILL_DUE: 'PATIENT.REFILL_DUE',
    PRESCRIPTION_READY: 'PATIENT.PRESCRIPTION_READY',
    PICKUP_REMINDER: 'PATIENT.PICKUP_REMINDER',
    LOYALTY_MILESTONE: 'PATIENT.LOYALTY_MILESTONE',
};

// ============================================================================
// BILLING EVENTS (Phase 2)
// ============================================================================

const BILLING_EVENTS = {
    PAYMENT_FAILED: 'BILLING.PAYMENT_FAILED',
    CREDIT_OVERDUE: 'BILLING.CREDIT_OVERDUE',
    INVOICE_GENERATED: 'BILLING.INVOICE_GENERATED',
    REFUND_INITIATED: 'BILLING.REFUND_INITIATED',
};

// ============================================================================
// SYSTEM EVENTS (Phase 2)
// ============================================================================

const SYSTEM_EVENTS = {
    LICENSE_EXPIRING: 'SYSTEM.LICENSE_EXPIRING',
    SUBSCRIPTION_EXPIRING: 'SYSTEM.SUBSCRIPTION_EXPIRING',
    BACKUP_FAILED: 'SYSTEM.BACKUP_FAILED',
};

// ============================================================================
// EVENT SCHEMAS - Define expected payload structure
// ============================================================================

const EVENT_SCHEMAS = {
    [INVENTORY_EVENTS.EXPIRY_NEAR]: {
        storeId: 'string',
        entityType: 'batch',
        entityId: 'string', // Batch ID
        drugId: 'string',
        drugName: 'string',
        batchNumber: 'string',
        expiryDate: 'date',
        daysLeft: 'number',
        baseUnitQuantity: 'number',
        mrp: 'number',
    },

    [INVENTORY_EVENTS.EXPIRED]: {
        storeId: 'string',
        entityType: 'batch',
        entityId: 'string',
        drugId: 'string',
        drugName: 'string',
        batchNumber: 'string',
        expiryDate: 'date',
        baseUnitQuantity: 'number',
        mrp: 'number',
    },

    [INVENTORY_EVENTS.LOW_STOCK]: {
        storeId: 'string',
        entityType: 'drug',
        entityId: 'string', // Drug ID
        drugName: 'string',
        currentStock: 'number',
        reorderLevel: 'number',
        deficit: 'number',
    },

    [AUTH_EVENTS.NEW_DEVICE_LOGIN]: {
        storeId: 'string',
        entityType: 'user',
        entityId: 'string', // User ID
        email: 'string',
        deviceInfo: 'string',
        ipAddress: 'string',
        location: 'object', // Geolocation data
        timestamp: 'date',
    },

    [AUTH_EVENTS.FAILED_LOGIN_ATTEMPTS]: {
        storeId: 'string',
        entityType: 'user',
        entityId: 'string',
        email: 'string',
        attemptCount: 'number',
        ipAddress: 'string',
        timestamp: 'date',
    },
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Event category objects
    INVENTORY_EVENTS,
    AUTH_EVENTS,
    PATIENT_EVENTS,
    BILLING_EVENTS,
    SYSTEM_EVENTS,

    // All events combined
    ALL_EVENTS: {
        ...INVENTORY_EVENTS,
        ...AUTH_EVENTS,
        ...PATIENT_EVENTS,
        ...BILLING_EVENTS,
        ...SYSTEM_EVENTS,
    },

    // Event schemas for validation
    EVENT_SCHEMAS,
};
