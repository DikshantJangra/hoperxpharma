/**
 * Payment System Constants
 * Central definition of payment states, transitions, and business rules
 */

// Payment Status Enum (matches Prisma schema)
const PAYMENT_STATUS = {
    CREATED: 'CREATED',       // Order created in DB, no Razorpay order yet
    INITIATED: 'INITIATED',   // Razorpay order created, user can pay
    PROCESSING: 'PROCESSING', // Signature verified, awaiting webhook
    SUCCESS: 'SUCCESS',       // Webhook confirmed, subscription activated
    FAILED: 'FAILED',         // Payment failed or rejected
    EXPIRED: 'EXPIRED',       // User didn't complete in time
    DISPUTED: 'DISPUTED',     // Chargeback filed
    REFUNDED: 'REFUNDED'      // Payment refunded
};

// Valid state transitions (State Machine)
const ALLOWED_TRANSITIONS = {
    [PAYMENT_STATUS.CREATED]: [
        PAYMENT_STATUS.INITIATED,
        PAYMENT_STATUS.EXPIRED
    ],
    [PAYMENT_STATUS.INITIATED]: [
        PAYMENT_STATUS.PROCESSING,
        PAYMENT_STATUS.FAILED,
        PAYMENT_STATUS.EXPIRED
    ],
    [PAYMENT_STATUS.PROCESSING]: [
        PAYMENT_STATUS.SUCCESS,
        PAYMENT_STATUS.FAILED
    ],
    [PAYMENT_STATUS.SUCCESS]: [
        PAYMENT_STATUS.REFUNDED,
        PAYMENT_STATUS.DISPUTED
    ],
    [PAYMENT_STATUS.FAILED]: [],      // Terminal state
    [PAYMENT_STATUS.EXPIRED]: [],     // Terminal state
    [PAYMENT_STATUS.REFUNDED]: [],    // Terminal state
    [PAYMENT_STATUS.DISPUTED]: [
        PAYMENT_STATUS.REFUNDED  // After dispute resolution
    ]
};

// Payment event types
const PAYMENT_EVENT_TYPE = {
    ORDER_CREATED: 'order_created',
    RAZORPAY_ORDER_CREATED: 'razorpay_order_created',
    SIGNATURE_VERIFIED: 'signature_verified',
    PAYMENT_CAPTURED: 'payment_captured',
    PAYMENT_FAILED: 'payment_failed',
    PAYMENT_REFUNDED: 'payment_refunded',
    PAYMENT_DISPUTED: 'payment_disputed',
    PAYMENT_EXPIRED: 'payment_expired',
    MANUAL_UPDATE: 'manual_update',
    RECONCILIATION_ATTEMPTED: 'reconciliation_attempted',
    WEBHOOK_RECEIVED: 'webhook_received'
};

// Event sources
const EVENT_SOURCE = {
    SYSTEM: 'system',
    USER: 'user',
    RAZORPAY_WEBHOOK: 'razorpay_webhook',
    RAZORPAY_API: 'razorpay_api',
    MANUAL: 'manual',
    RECONCILIATION: 'reconciliation',
    ADMIN: 'admin'
};

// Payment timeouts
const PAYMENT_TIMEOUT = {
    ORDER_EXPIRY_MINUTES: 60,           // Expire CREATED/INITIATED after 1 hour
    PROCESSING_TIMEOUT_MINUTES: 30,     // Reconcile PROCESSING after 30 mins
    WEBHOOK_RETRY_INTERVAL_MINUTES: 15  // Run reconciliation every 15 mins
};

// Webhook event types (from Razorpay)
const RAZORPAY_WEBHOOK_EVENTS = {
    PAYMENT_AUTHORIZED: 'payment.authorized',
    PAYMENT_CAPTURED: 'payment.captured',
    PAYMENT_FAILED: 'payment.failed',
    ORDER_PAID: 'order.paid',
    REFUND_CREATED: 'refund.created',
    REFUND_PROCESSED: 'refund.processed',
    DISPUTE_CREATED: 'dispute.created'
};

// Payment error codes
const PAYMENT_ERROR_CODE = {
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
    DUPLICATE_PAYMENT: 'DUPLICATE_PAYMENT',
    PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
    UNAUTHORIZED_STORE: 'UNAUTHORIZED_STORE',
    RAZORPAY_API_ERROR: 'RAZORPAY_API_ERROR',
    WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
    WEBHOOK_PROCESSING_ERROR: 'WEBHOOK_PROCESSING_ERROR'
};

// Subscription plan pricing (seed data reference)
const SUBSCRIPTION_PLANS = {
    RETAIL_MONTHLY: {
        name: 'retail_monthly',
        displayName: 'Retail Pharmacy - Monthly',
        pricePaise: 29900,  // ₹299
        billingCycle: 'monthly',
        vertical: 'retail'
    },
    RETAIL_YEARLY: {
        name: 'retail_yearly',
        displayName: 'Retail Pharmacy - Yearly',
        pricePaise: 299900,  // ₹2999
        billingCycle: 'yearly',
        vertical: 'retail'
    },
    WHOLESALE_MONTHLY: {
        name: 'wholesale_monthly',
        displayName: 'Wholesale Pharmacy - Monthly',
        pricePaise: 49900,  // ₹499
        billingCycle: 'monthly',
        vertical: 'wholesale'
    },
    WHOLESALE_YEARLY: {
        name: 'wholesale_yearly',
        displayName: 'Wholesale Pharmacy - Yearly',
        pricePaise: 499900,  // ₹4999
        billingCycle: 'yearly',
        vertical: 'wholesale'
    },
    HOSPITAL_MONTHLY: {
        name: 'hospital_monthly',
        displayName: 'Hospital Pharmacy - Monthly',
        pricePaise: 99900,  // ₹999
        billingCycle: 'monthly',
        vertical: 'hospital'
    },
    HOSPITAL_YEARLY: {
        name: 'hospital_yearly',
        displayName: 'Hospital Pharmacy - Yearly',
        pricePaise: 999900,  // ₹9999
        billingCycle: 'yearly',
        vertical: 'hospital'
    }
};

// Helper functions
const isValidTransition = (fromStatus, toStatus) => {
    return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

const isTerminalState = (status) => {
    return ALLOWED_TRANSITIONS[status]?.length === 0;
};

const paiseToRupees = (paise) => {
    return (paise / 100).toFixed(2);
};

const rupeesToPaise = (rupees) => {
    return Math.round(rupees * 100);
};

module.exports = {
    PAYMENT_STATUS,
    ALLOWED_TRANSITIONS,
    PAYMENT_EVENT_TYPE,
    EVENT_SOURCE,
    PAYMENT_TIMEOUT,
    RAZORPAY_WEBHOOK_EVENTS,
    PAYMENT_ERROR_CODE,
    SUBSCRIPTION_PLANS,
    isValidTransition,
    isTerminalState,
    paiseToRupees,
    rupeesToPaise
};
