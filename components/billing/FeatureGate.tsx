'use client';

import { ReactNode } from 'react';
import { Feature } from '@/lib/constants/billing-states';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import { UpgradeScreen } from './UpgradeScreen';

interface FeatureGateProps {
    /** The feature to check access for */
    feature: Feature;

    /** Content to show when user has access */
    children: ReactNode;

    /** Custom fallback when access is denied (default: UpgradeScreen) */
    fallback?: ReactNode;

    /** Use inline upgrade screen instead of full page */
    inline?: boolean;
}

/**
 * FeatureGate - Wrapper component for protecting routes/features
 * 
 * Usage:
 * ```tsx
 * <FeatureGate feature={Feature.REPORTS}>
 *   <ReportsContent />
 * </FeatureGate>
 * ```
 * 
 * If user doesn't have access, shows UpgradeScreen instead
 */
export function FeatureGate({
    feature,
    children,
    fallback,
    inline = false
}: FeatureGateProps) {
    const { hasAccess } = useFeatureAccess(feature);

    // User has access - show the content
    if (hasAccess) {
        return <>{children}</>;
    }

    // User blocked - show upgrade screen or custom fallback
    if (fallback) {
        return <>{fallback}</>;
    }

    return <UpgradeScreen feature={feature} fullPage={!inline} />;
}
