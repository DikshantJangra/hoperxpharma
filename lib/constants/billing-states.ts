/**
 * Billing State System
 * 
 * Core principle: Billing should NEVER interrupt daily operations,
 * but must clearly gate advanced value.
 */

// ============================================================================
// BILLING STATES
// ============================================================================

export enum BillingState {
    /** Full access to active modules, clear countdown, no disruption */
    TRIAL_ACTIVE = 'TRIAL_ACTIVE',

    /** Core operations allowed, advanced actions gated, calm reminders */
    TRIAL_EXPIRED = 'TRIAL_EXPIRED',

    /** No friction, no banners, no reminders */
    PAID_ACTIVE = 'PAID_ACTIVE',

    /** Graceful degradation, soft blocks only, never break POS mid-sale */
    PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
}

// ============================================================================
// FEATURES
// ============================================================================

export enum Feature {
    // CORE OPERATIONS (ALWAYS AVAILABLE - SACRED)
    // These NEVER get blocked regardless of billing state
    POS = 'POS',
    BILLING = 'BILLING',
    INVENTORY = 'INVENTORY',
    INVOICE_GENERATION = 'INVOICE_GENERATION',
    GST_CALCULATION = 'GST_CALCULATION',
    INVOICE_PRINT = 'INVOICE_PRINT',
    CUSTOMERS = 'CUSTOMERS',
    PRESCRIPTIONS = 'PRESCRIPTIONS',

    // GATED FEATURES (REQUIRE ACTIVE SUBSCRIPTION)
    WHATSAPP = 'WHATSAPP',
    SMS = 'SMS',
    REPORTS = 'REPORTS',
    ADVANCED_REPORTS = 'ADVANCED_REPORTS',
    LOYALTY = 'LOYALTY',
    AUTOMATION = 'AUTOMATION',
    BULK_EXPORT = 'BULK_EXPORT',
    MULTI_STORE_SYNC = 'MULTI_STORE_SYNC',
    CREDIT_TERMS = 'CREDIT_TERMS',
    BULK_INVOICING = 'BULK_INVOICING',
    IPD_OPD_BILLING = 'IPD_OPD_BILLING',
    WARD_DISPENSING = 'WARD_DISPENSING',
    DOCTOR_ORDERS = 'DOCTOR_ORDERS',
    HQ_DASHBOARD = 'HQ_DASHBOARD',
}

// ============================================================================
// FEATURE ACCESS RULES
// ============================================================================

interface FeatureAccessRule {
    /** Billing states where this feature is accessible */
    allowedStates: BillingState[];

    /** Modules that unlock this feature (empty = available to all) */
    requiredModules: string[];

    /** Human-readable reason when blocked */
    blockReason: string;

    /** Upgrade prompt text */
    upgradePrompt: string;
}

export const FEATURE_ACCESS_RULES: Record<Feature, FeatureAccessRule> = {
    // CORE OPERATIONS - ALWAYS AVAILABLE
    [Feature.POS]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.BILLING]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.INVENTORY]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.INVOICE_GENERATION]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.GST_CALCULATION]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.INVOICE_PRINT]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.CUSTOMERS]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    [Feature.PRESCRIPTIONS]: {
        allowedStates: [
            BillingState.TRIAL_ACTIVE,
            BillingState.TRIAL_EXPIRED,
            BillingState.PAID_ACTIVE,
            BillingState.PAYMENT_OVERDUE,
        ],
        requiredModules: [],
        blockReason: '',
        upgradePrompt: '',
    },

    // GATED FEATURES
    [Feature.WHATSAPP]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL'],
        blockReason: 'WhatsApp bills require an active plan',
        upgradePrompt: 'Keep customers updated automatically via WhatsApp.',
    },

    [Feature.SMS]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL'],
        blockReason: 'SMS notifications require an active plan',
        upgradePrompt: 'Send automated SMS notifications to customers.',
    },

    [Feature.REPORTS]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL', 'MULTICHAIN'],
        blockReason: 'Advanced reports require an active plan',
        upgradePrompt: 'Get detailed insights into your business performance.',
    },

    [Feature.ADVANCED_REPORTS]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL', 'MULTICHAIN'],
        blockReason: 'Advanced analytics require an active plan',
        upgradePrompt: 'Unlock deeper insights with advanced reporting.',
    },

    [Feature.LOYALTY]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL'],
        blockReason: 'Loyalty rewards require Retail plan',
        upgradePrompt: 'Build customer loyalty with automated rewards.',
    },

    [Feature.AUTOMATION]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL', 'MULTICHAIN'],
        blockReason: 'Automation features require an active plan',
        upgradePrompt: 'Save time with automated workflows.',
    },

    [Feature.BULK_EXPORT]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['RETAIL', 'WHOLESALE', 'HOSPITAL', 'MULTICHAIN'],
        blockReason: 'Bulk export requires an active plan',
        upgradePrompt: 'Export your data in bulk for analysis.',
    },

    [Feature.MULTI_STORE_SYNC]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['MULTICHAIN'],
        blockReason: 'Multi-store sync requires Multichain plan',
        upgradePrompt: 'Sync inventory across all your locations.',
    },

    [Feature.CREDIT_TERMS]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['WHOLESALE'],
        blockReason: 'Credit terms require Wholesale plan',
        upgradePrompt: 'Manage B2B credit terms and payment schedules.',
    },

    [Feature.BULK_INVOICING]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['WHOLESALE'],
        blockReason: 'Bulk invoicing requires Wholesale plan',
        upgradePrompt: 'Create multiple invoices in one go.',
    },

    [Feature.IPD_OPD_BILLING]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['HOSPITAL'],
        blockReason: 'IPD/OPD billing requires Hospital Operations plan',
        upgradePrompt: 'Manage inpatient and outpatient billing workflows.',
    },

    [Feature.WARD_DISPENSING]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['HOSPITAL'],
        blockReason: 'Ward dispensing requires Hospital Operations plan',
        upgradePrompt: 'Track medication dispensing at ward level.',
    },

    [Feature.DOCTOR_ORDERS]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['HOSPITAL'],
        blockReason: 'Doctor orders require Hospital Operations plan',
        upgradePrompt: 'Integrate with doctor prescriptions and orders.',
    },

    [Feature.HQ_DASHBOARD]: {
        allowedStates: [BillingState.TRIAL_ACTIVE, BillingState.PAID_ACTIVE],
        requiredModules: ['MULTICHAIN'],
        blockReason: 'HQ dashboard requires Multichain plan',
        upgradePrompt: 'Monitor all locations from a single dashboard.',
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a feature is accessible based on billing state and active modules
 */
export function canAccessFeature(
    feature: Feature,
    billingState: BillingState,
    activeModules: string[]
): boolean {
    const rule = FEATURE_ACCESS_RULES[feature];

    // Check billing state
    if (!rule.allowedStates.includes(billingState)) {
        return false;
    }

    // If no specific modules required, feature is available
    if (rule.requiredModules.length === 0) {
        return true;
    }

    // Check if user has at least one of the required modules
    return rule.requiredModules.some(module => activeModules.includes(module));
}

/**
 * Get upgrade information for a blocked feature
 */
export function getUpgradeInfo(feature: Feature) {
    const rule = FEATURE_ACCESS_RULES[feature];
    return {
        reason: rule.blockReason,
        prompt: rule.upgradePrompt,
        requiredModules: rule.requiredModules,
    };
}

/**
 * Calculate days remaining in trial
 */
export function calculateDaysRemaining(expiryDate: Date): number {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Determine billing state from subscription data
 */
export function determineBillingState(subscription: {
    status: string;
    expiresAt: Date | null;
    isTrial: boolean;
}): BillingState {
    const now = new Date();

    // Trial active
    if (subscription.isTrial && subscription.expiresAt && subscription.expiresAt > now) {
        return BillingState.TRIAL_ACTIVE;
    }

    // Trial expired
    if (subscription.isTrial && subscription.expiresAt && subscription.expiresAt <= now) {
        return BillingState.TRIAL_EXPIRED;
    }

    // Paid and active
    if (subscription.status === 'active' && !subscription.isTrial) {
        return BillingState.PAID_ACTIVE;
    }

    // Payment overdue
    if (subscription.status === 'overdue' || subscription.status === 'past_due') {
        return BillingState.PAYMENT_OVERDUE;
    }

    // Default to trial expired for safety
    return BillingState.TRIAL_EXPIRED;
}
