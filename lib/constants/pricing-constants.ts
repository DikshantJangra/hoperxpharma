// Enterprise-Ready Pricing Configuration for HopeRx
// Approachable entry pricing, scales with usage

export type ModuleStatus = 'active' | 'coming_soon' | 'disabled';

export interface VerticalPricing {
    display: string;  // What to show: "Starting from ₹799", "Custom pricing"
    entry: number;    // Entry price point
    model: 'fixed' | 'usage' | 'custom';
    unit?: string;    // "per store", "per bed", etc.
}

export interface BusinessVertical {
    id: string;
    name: string;
    displayName: string;
    tagline: string;
    description: string;
    detailedDescription: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
    pricing: VerticalPricing;
    status: ModuleStatus;
    features: string[];
    useCases: string[];
    canBeStandalone: boolean;
    cta: {
        available: string;
        earlyAccess: string;
    };
}

// =============================================================================
// BUSINESS VERTICALS CONFIGURATION
// =============================================================================

export const BUSINESS_VERTICALS: Record<string, BusinessVertical> = {
    RETAIL: {
        id: 'retail',
        name: 'RETAIL',
        displayName: 'Retail Pharmacy',
        tagline: 'Complete pharmacy management',
        description: 'Single-store pharmacy operations with POS, inventory, and patient management',
        detailedDescription: 'Built for independent pharmacies and single-location stores. Manage prescriptions, billing, inventory, expiry tracking, and customer loyalty — all in one place.',
        icon: 'FiShoppingBag',
        color: 'emerald',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        pricing: {
            display: 'Starting from ₹799',
            entry: 799,
            model: 'fixed',
            unit: 'per month',
        },
        status: 'active',
        canBeStandalone: true,
        cta: {
            available: 'Start 14-Day Trial',
            earlyAccess: 'Join Early Access',
        },
        features: [
            'Unlimited Prescriptions',
            'Advanced Inventory & Expiry',
            'WhatsApp & SMS Integration',
            'Smart GST Filing',
            'Customer Loyalty Program',
            'Priority Support',
        ],
        useCases: [
            'Independent pharmacies',
            'Medical stores',
            'Community pharmacies',
        ],
    },

    WHOLESALE: {
        id: 'wholesale',
        name: 'WHOLESALE',
        displayName: 'Wholesale Distribution',
        tagline: 'Bulk operations & B2B management',
        description: 'Distributor workflows with bulk invoicing, credit management, and multi-party billing',
        detailedDescription: 'Designed for pharmaceutical distributors and wholesalers. Handle bulk orders, manage credit terms, track distributor margins, and streamline B2B operations.',
        icon: 'FiPackage',
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        pricing: {
            display: 'Custom pricing',
            entry: 0,
            model: 'custom',
            unit: 'based on volume',
        },
        status: 'coming_soon',
        canBeStandalone: true,
        cta: {
            available: 'Get Started',
            earlyAccess: 'Request Access',
        },
        features: [
            'Bulk B2B Invoicing',
            'Credit & Payment Terms',
            'Multi-party Billing',
            'Distributor Margin Tracking',
            'Scheme Management',
            'Territory-wise Reports',
        ],
        useCases: [
            'Pharmaceutical distributors',
            'C&F agents',
            'Stockists',
        ],
    },

    HOSPITAL: {
        id: 'hospital',
        name: 'HOSPITAL',
        displayName: 'Hospital Operations',
        tagline: 'IPD/OPD & clinical workflows',
        description: 'Hospital pharmacy with ward management, IPD/OPD billing, and clinical integrations',
        detailedDescription: 'Purpose-built for hospital pharmacies. Manage IPD/OPD dispensing, ward-wise inventory, doctor orders, and integrate with hospital management systems.',
        icon: 'FiActivity',
        color: 'purple',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        pricing: {
            display: 'Custom pricing',
            entry: 0,
            model: 'custom',
            unit: 'based on beds',
        },
        status: 'coming_soon',
        canBeStandalone: true,
        cta: {
            available: 'Get Started',
            earlyAccess: 'Talk to Us',
        },
        features: [
            'IPD/OPD Management',
            'Ward-wise Dispensing',
            'Doctor Order Integration',
            'Clinical Workflows',
            'Patient Bed Tracking',
            'Insurance Billing',
        ],
        useCases: [
            'Hospital pharmacies',
            'Nursing homes',
            'Diagnostic centers',
        ],
    },

    MULTICHAIN: {
        id: 'multichain',
        name: 'MULTICHAIN',
        displayName: 'Multi-chain HQ',
        tagline: 'Control layer for chains',
        description: 'Headquarters visibility and governance for multi-store pharmacy chains',
        detailedDescription: 'Not a standalone business — a control layer. Get unified visibility, central inventory control, and chain-wide analytics across all your locations.',
        icon: 'FiGrid',
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        pricing: {
            display: 'Enterprise pricing',
            entry: 0,
            model: 'usage',
            unit: 'per store',
        },
        status: 'coming_soon',
        canBeStandalone: false,
        cta: {
            available: 'Get Started',
            earlyAccess: 'Talk to Us',
        },
        features: [
            'Central Dashboard',
            'Store Performance Analytics',
            'Unified Inventory View',
            'Chain-wide Reporting',
            'Inter-store Transfers',
            'Consolidated Billing',
        ],
        useCases: [
            'Pharmacy chains',
            'Multi-location hospitals',
            'Franchise networks',
        ],
    },
};

// =============================================================================
// COMBO BUNDLES (REALISTIC COMBINATIONS)
// =============================================================================

export interface ComboBundle {
    id: string;
    name: string;
    verticals: string[];
    pricing: {
        display: string;
        savings?: string;
    };
    popular?: boolean;
    description: string;
}

export const COMBO_BUNDLES: ComboBundle[] = [
    {
        id: 'retail-wholesale',
        name: 'Retail + Wholesale',
        verticals: ['retail', 'wholesale'],
        pricing: {
            display: 'Custom pricing',
            savings: 'Volume discounts available',
        },
        description: 'Perfect for pharmacies expanding into distribution',
    },
    {
        id: 'retail-hospital',
        name: 'Retail + Hospital',
        verticals: ['retail', 'hospital'],
        pricing: {
            display: 'Custom pricing',
            savings: 'Tailored for hospital pharmacies',
        },
        popular: true,
        description: 'Ideal for hospital pharmacies with retail counters',
    },
    {
        id: 'wholesale-hospital',
        name: 'Wholesale + Hospital',
        verticals: ['wholesale', 'hospital'],
        pricing: {
            display: 'Enterprise pricing',
            savings: 'Contact for quote',
        },
        description: 'For distributors serving hospital networks',
    },
    {
        id: 'complete-suite',
        name: 'Complete Suite',
        verticals: ['retail', 'wholesale', 'hospital'],
        pricing: {
            display: 'Enterprise pricing',
            savings: 'Maximum flexibility',
        },
        description: 'All-in-one for integrated healthcare businesses',
    },
];

// =============================================================================
// FREE TIER (Entry Point)
// =============================================================================

export const FREE_TIER = {
    name: 'Free Forever',
    price: 0,
    description: 'Perfect for new pharmacies getting started.',
    features: [
        'Up to 50 prescriptions/month',
        'Basic POS & Billing',
        'Manual GST Reports',
        'Email Support',
        'Single User',
    ],
    notIncluded: [
        'WhatsApp Integration',
        'Inventory Forecasting',
        'Priority Support',
    ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function formatPrice(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

export function getVerticalById(id: string): BusinessVertical | undefined {
    return Object.values(BUSINESS_VERTICALS).find(v => v.id === id);
}

export function getActiveVerticals(): BusinessVertical[] {
    return Object.values(BUSINESS_VERTICALS).filter(v => v.status === 'active');
}

export function getComingSoonVerticals(): BusinessVertical[] {
    return Object.values(BUSINESS_VERTICALS).filter(v => v.status === 'coming_soon');
}

export function getStandaloneVerticals(): BusinessVertical[] {
    return Object.values(BUSINESS_VERTICALS).filter(v => v.canBeStandalone);
}

/**
 * Get price for a vertical (backward compatibility)
 * @param vertical - The business vertical
 * @param combined - Whether combined pricing (deprecated, now uses same pricing)
 * @param annual - Whether annual pricing (deprecated, now handled by display)
 * @returns Entry price or 0 for custom pricing
 */
export function getVerticalPrice(
    vertical: BusinessVertical,
    combined: boolean = false,
    annual: boolean = false
): number {
    // For custom/usage-based pricing, return 0
    if (vertical.pricing.model === 'custom' || vertical.pricing.model === 'usage') {
        return 0;
    }

    // Return entry price for fixed pricing
    return vertical.pricing.entry;
}

