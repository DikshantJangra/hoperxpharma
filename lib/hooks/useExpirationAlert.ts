'use client';

import { useMemo } from 'react';
import type {
    SubscriptionExpirationData,
    ExpirationAlert
} from '@/lib/types/expiration.types';

/**
 * Hook to generate expiration alert based on subscription state
 * Implements 7-3-1 day psychological timeline
 */
export function useExpirationAlert(
    subscriptionData: SubscriptionExpirationData | null
): ExpirationAlert | null {
    return useMemo(() => {
        if (!subscriptionData) return null;

        const { daysUntilExpiry, status, gracePeriod, autoRenewEnabled } = subscriptionData;

        // Active subscription, far from expiry
        if (status === 'ACTIVE' && daysUntilExpiry > 7) {
            return null; // No alert needed
        }

        // 7-day warning (Info - Blue)
        if (status === 'ACTIVE' && daysUntilExpiry <= 7 && daysUntilExpiry > 3) {
            return {
                severity: 'info',
                title: autoRenewEnabled ? 'Subscription renewal coming' : 'Subscription expiring soon',
                message: autoRenewEnabled
                    ? `Your subscription will renew automatically in ${daysUntilExpiry} days.`
                    : `Your subscription expires in ${daysUntilExpiry} days.`,
                action: {
                    label: autoRenewEnabled ? 'Manage Subscription' : 'Renew Now',
                    href: '/profile#billing',
                },
                dismissible: true,
            };
        }

        // 3-day warning (Warning - Yellow)
        if (status === 'ACTIVE' && daysUntilExpiry <= 3 && daysUntilExpiry > 1) {
            return {
                severity: 'warning',
                title: 'Subscription expires soon',
                message: `Your subscription expires in ${daysUntilExpiry} days. ${autoRenewEnabled
                        ? 'Renewal will happen automatically.'
                        : 'Renew now to avoid interruption.'
                    }`,
                action: {
                    label: 'Renew Now',
                    href: '/profile#billing',
                },
                dismissible: true,
            };
        }

        // 1-day warning (Error - Orange)
        if (status === 'ACTIVE' && daysUntilExpiry === 1) {
            return {
                severity: 'error',
                title: 'Subscription expires tomorrow',
                message: autoRenewEnabled
                    ? 'Your subscription will renew automatically tomorrow.'
                    : 'Your subscription expires tomorrow. Renew today to keep your access.',
                action: {
                    label: 'Renew Now',
                    href: '/profile#billing',
                },
                dismissible: false, // Non-dismissible for urgency
            };
        }

        // Expired - Grace period active (Critical - Red)
        if (status === 'EXPIRED' && gracePeriod.isInGracePeriod) {
            return {
                severity: 'critical',
                title: 'Subscription expired',
                message: `Your subscription has expired. You have ${gracePeriod.graceDaysLeft} days of grace period to renew.`,
                action: {
                    label: 'Renew Now',
                    href: '/profile#billing',
                },
                dismissible: false,
            };
        }

        // Expired - Grace period ended (Critical - Red)
        if (status === 'EXPIRED' && !gracePeriod.isInGracePeriod) {
            return {
                severity: 'critical',
                title: 'Subscription ended',
                message: 'Your subscription has ended. Renew to restore full access.',
                action: {
                    label: 'Renew Now',
                    href: '/profile#billing',
                },
                dismissible: false,
            };
        }

        // Trial expired
        if (status === 'TRIAL_EXPIRED') {
            return {
                severity: 'warning',
                title: 'Trial expired',
                message: 'Your trial period has ended. Subscribe to continue using premium features.',
                action: {
                    label: 'Subscribe Now',
                    href: '/profile#billing',
                },
                dismissible: false,
            };
        }

        return null;
    }, [subscriptionData]);
}
