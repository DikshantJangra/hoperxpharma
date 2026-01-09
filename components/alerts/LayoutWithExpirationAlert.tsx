/**
 * Example Integration: Subscription Expiration Banner
 * 
 * Shows how to integrate the expiration alert banner into your app layout.
 */

'use client';

import { useMemo } from 'react';
import { useBillingState } from '@/lib/hooks/useBillingState';
import { useExpirationAlert } from '@/lib/hooks/useExpirationAlert';
import { SubscriptionExpirationBanner } from '@/components/alerts/SubscriptionExpirationBanner';
import type { SubscriptionExpirationData } from '@/lib/types/expiration.types';
import { useAuthStore } from '@/lib/store/auth-store';

export function LayoutWithExpirationAlert({ children }: { children: React.ReactNode }) {
    const billingState = useBillingState();
    const { primaryStore } = useAuthStore();
    const subscription = primaryStore?.subscription;

    // Transform subscription data for expiration check
    const expirationData: SubscriptionExpirationData | null = useMemo(() => {
        if (!subscription) return null;

        // These fields will be added to the backend schema in the future
        // For now, we handle their absence gracefully
        const expiresAt = (subscription as any).expiresAt
            ? new Date((subscription as any).expiresAt)
            : subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : new Date();

        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const graceEndsAt = (subscription as any).gracePeriodEndsAt
            ? new Date((subscription as any).gracePeriodEndsAt)
            : null;

        const graceDaysLeft = graceEndsAt
            ? Math.ceil((graceEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Map backend status to frontend enum
        const statusMap: Record<string, SubscriptionExpirationData['status']> = {
            'TRIAL_ACTIVE': 'TRIAL_ACTIVE',
            'TRIAL_EXPIRED': 'TRIAL_EXPIRED',
            'ACTIVE': 'ACTIVE',
            'EXPIRED': 'EXPIRED',
            'CANCELLED': 'CANCELLED',
        };

        const mappedStatus = statusMap[subscription.status?.toUpperCase() || 'TRIAL_ACTIVE'] || 'TRIAL_ACTIVE';

        return {
            status: mappedStatus,
            expiresAt,
            daysUntilExpiry,
            gracePeriod: {
                isInGracePeriod: Boolean((subscription as any).gracePeriodGranted && graceDaysLeft > 0),
                graceDaysLeft: Math.max(0, graceDaysLeft),
                graceEndsAt,
            },
            autoRenewEnabled: (subscription as any).autoRenewEnabled ?? true,
        };
    }, [subscription]);

    // Generate alert based on expiration state
    const alert = useExpirationAlert(expirationData);

    return (
        <>
            {/* Expiration Alert Banner */}
            {alert && (
                <SubscriptionExpirationBanner
                    alert={alert}
                    onDismiss={() => {
                        // Optional: Store dismissal in localStorage
                        localStorage.setItem(`alert-dismissed-${subscription?.id}`, Date.now().toString());
                    }}
                />
            )}

            {/* Main App Content */}
            {children}
        </>
    );
}

/**
 * Usage in app/(main)/layout.tsx:
 * 
 * import { LayoutWithExpirationAlert } from '@/components/alerts/LayoutWithExpirationAlert';
 * 
 * export default function MainLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <LayoutWithExpirationAlert>
 *       {children}
 *     </LayoutWithExpirationAlert>
 *   );
 * }
 */
