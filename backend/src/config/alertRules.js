const { INVENTORY_EVENTS, AUTH_EVENTS } = require('../events/eventTypes');

/**
 * Alert Rule Configurations
 * Define business rules for when and how alerts should be created
 * 
 * MICROCOPY PRINCIPLES:
 * - Calm, neutral, action-first
 * - Structure: What happened → Why it matters → What to do
 * - Blame-free language
 * - Time-aware messaging
 */

// ============================================================================
// INVENTORY ALERT RULES
// ============================================================================

const INVENTORY_RULES = [
    {
        id: 'inventory-expired-batch',
        eventType: INVENTORY_EVENTS.EXPIRED,
        enabled: true,

        condition: (payload) => true,
        priority: () => 'CRITICAL',
        category: 'INVENTORY',
        channels: ['IN_APP'],
        blockAction: true,

        title: (payload) => `Expired batch detected`,
        message: (payload) =>
            `This batch has crossed its expiry date and cannot be sold.\n\n` +
            `Batch ${payload.batchNumber} of ${payload.drugName} expired on ${new Date(payload.expiryDate).toLocaleDateString()}. ` +
            `${payload.baseUnitQuantity} units remaining.\n\n` +
            `Action required: Remove the batch from active stock.`,

        actionLabel: 'View Batch',
        actionUrl: (payload) => `/inventory/batches/${payload.entityId}`,
        deduplicationWindow: 24 * 60 * 60 * 1000,
    },

    {
        id: 'inventory-expiry-near-critical',
        eventType: INVENTORY_EVENTS.EXPIRY_NEAR,
        enabled: true,

        condition: (payload) => payload.daysLeft <= 7,
        priority: (payload) => payload.daysLeft <= 3 ? 'CRITICAL' : 'HIGH',
        category: 'INVENTORY',
        channels: ['IN_APP'],
        blockAction: false,

        title: (payload) =>
            payload.daysLeft === 0
                ? `Batch expires today`
                : payload.daysLeft === 1
                    ? `Batch expires tomorrow`
                    : `Batch expiring in ${payload.daysLeft} days`,

        message: (payload) => {
            const expiryDate = new Date(payload.expiryDate).toLocaleDateString();
            const urgency = payload.daysLeft <= 3
                ? 'This batch will soon be unsellable.'
                : 'This batch is approaching expiry.';

            return `${urgency}\n\n` +
                `${payload.drugName} batch ${payload.batchNumber} expires on ${expiryDate}. ` +
                `${payload.baseUnitQuantity} units in stock.\n\n` +
                `Consider a discount sale or supplier return to minimize loss.`;
        },

        actionLabel: 'View Batch',
        actionUrl: (payload) => `/inventory/batches/${payload.entityId}`,
        deduplicationWindow: 24 * 60 * 60 * 1000,
    },

    {
        id: 'inventory-expiry-near-warning',
        eventType: INVENTORY_EVENTS.EXPIRY_NEAR,
        enabled: true,

        condition: (payload) => payload.daysLeft > 7 && payload.daysLeft <= 30,
        priority: () => 'MEDIUM',
        category: 'INVENTORY',
        channels: ['IN_APP'],
        blockAction: false,

        title: (payload) => `Batch expiring in ${payload.daysLeft} days`,
        message: (payload) =>
            `Plan ahead to avoid stock loss.\n\n` +
            `${payload.drugName} batch ${payload.batchNumber} expires on ${new Date(payload.expiryDate).toLocaleDateString()}. ` +
            `${payload.baseUnitQuantity} units in stock.`,

        actionLabel: 'View Batch',
        actionUrl: (payload) => `/inventory/batches/${payload.entityId}`,
        deduplicationWindow: 7 * 24 * 60 * 60 * 1000,
    },

    {
        id: 'inventory-low-stock',
        eventType: INVENTORY_EVENTS.LOW_STOCK,
        enabled: true,

        condition: (payload) => true,
        priority: (payload) => {
            const deficitPercent = (payload.deficit / payload.reorderLevel) * 100;
            return deficitPercent >= 50 ? 'HIGH' : 'MEDIUM';
        },

        category: 'INVENTORY',
        channels: ['IN_APP'],
        blockAction: false,

        title: (payload) => `Stock running low`,
        message: (payload) =>
            `${payload.drugName} is below the reorder level.\n\n` +
            `Current stock: ${payload.currentStock} units · Reorder level: ${payload.reorderLevel} units\n\n` +
            `Consider placing a purchase order to avoid stock-out.`,

        actionLabel: 'Place Order',
        actionUrl: (payload) => `/purchase-orders/new?drugId=${payload.entityId}`,
        deduplicationWindow: 24 * 60 * 60 * 1000,
    },
];

// ============================================================================
// SECURITY/AUTH ALERT RULES
// ============================================================================

const AUTH_RULES = [
    {
        id: 'auth-new-device-login',
        eventType: AUTH_EVENTS.NEW_DEVICE_LOGIN,
        enabled: true,

        condition: (payload) => true,
        priority: () => 'HIGH',
        category: 'SECURITY',
        channels: ['IN_APP'],
        blockAction: false,

        title: (payload) => `New login detected`,
        message: (payload) => {
            const location = payload.location
                ? `${payload.location.cityName || 'Unknown City'}, ${payload.location.countryName || 'Unknown Country'}`
                : 'Unknown Location';
            const time = new Date(payload.timestamp).toLocaleString();

            return `Your account was accessed from a new device.\n\n` +
                `Time: ${time}\n` +
                `Device: ${payload.deviceInfo || 'Unknown'}\n` +
                `Location: ${location}\n` +
                `IP Address: ${payload.ipAddress}\n\n` +
                `If this wasn't you, secure your account immediately.`;
        },

        actionLabel: 'View Security',
        actionUrl: (payload) => `/profile/security`,
        deduplicationWindow: 60 * 60 * 1000,
    },

    {
        id: 'auth-failed-login-attempts',
        eventType: AUTH_EVENTS.FAILED_LOGIN_ATTEMPTS,
        enabled: true,

        condition: (payload) => payload.attemptCount >= 3,
        priority: (payload) => payload.attemptCount >= 5 ? 'CRITICAL' : 'HIGH',
        category: 'SECURITY',
        channels: ['IN_APP'],
        blockAction: false,

        title: (payload) => `Multiple failed login attempts`,
        message: (payload) =>
            `Unusual login activity detected on your account.\n\n` +
            `${payload.attemptCount} failed attempts from IP ${payload.ipAddress} at ${new Date(payload.timestamp).toLocaleString()}.\n\n` +
            `Your account may be under attack. Consider changing your password.`,

        actionLabel: 'Secure Account',
        actionUrl: (payload) => `/profile/security`,
        deduplicationWindow: 30 * 60 * 1000,
    },
];

// ============================================================================
// COMBINED RULES EXPORT
// ============================================================================

module.exports = {
    INVENTORY_RULES,
    AUTH_RULES,

    ALL_RULES: [
        ...INVENTORY_RULES,
        ...AUTH_RULES,
    ],
};
