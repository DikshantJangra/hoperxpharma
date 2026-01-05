'use client';

import { useBillingState } from './useBillingState';
import { Feature, getUpgradeInfo } from '@/lib/constants/billing-states';

interface FeatureAccessData {
    /** Does user have access to this feature? */
    hasAccess: boolean;

    /** Human-readable reason if blocked */
    reason: string;

    /** Upgrade prompt text */
    upgradePrompt: string;

    /** Modules required to unlock this feature */
    requiredModules: string[];

    /** Is this feature always available (core operation)? */
    isCore: boolean;
}

/**
 * Hook for checking access to specific features
 * 
 * Usage:
 * ```tsx
 * const whatsapp = useFeatureAccess(Feature.WHATSAPP);
 * 
 * if (!whatsapp.hasAccess) {
 *   // Show upgrade prompt
 *   return <GatedFeatureCard {...whatsapp} />;
 * }
 * ```
 */
export function useFeatureAccess(feature: Feature): FeatureAccessData {
    const { canUse } = useBillingState();

    const hasAccess = canUse(feature);
    const upgradeInfo = getUpgradeInfo(feature);

    // Core features that are never blocked
    const coreFeatures = [
        Feature.POS,
        Feature.BILLING,
        Feature.INVENTORY,
        Feature.INVOICE_GENERATION,
        Feature.GST_CALCULATION,
        Feature.INVOICE_PRINT,
        Feature.CUSTOMERS,
        Feature.PRESCRIPTIONS,
    ];

    return {
        hasAccess,
        reason: hasAccess ? '' : upgradeInfo.reason,
        upgradePrompt: hasAccess ? '' : upgradeInfo.prompt,
        requiredModules: upgradeInfo.requiredModules,
        isCore: coreFeatures.includes(feature),
    };
}
