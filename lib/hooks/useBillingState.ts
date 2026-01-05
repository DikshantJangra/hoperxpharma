'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import {
    BillingState,
    determineBillingState,
    calculateDaysRemaining,
    canAccessFeature,
    Feature,
} from '@/lib/constants/billing-states';

interface BillingStateData {
    /** Current billing state */
    state: BillingState;

    /** Days remaining in trial (0 if not in trial) */
    daysRemaining: number;

    /** Currently active modules */
    activeModules: string[];

    /** Check if user can access a specific feature */
    canUse: (feature: Feature) => boolean;

    /** Is user in trial? */
    isTrial: boolean;

    /** Is subscription active (paid)? */
    isPaid: boolean;

    /** Is trial still active? */
    isTrialActive: boolean;

    /** Is trial expired? */
    isTrialExpired: boolean;

    /** Is payment overdue? */
    isPaymentOverdue: boolean;

    /** Next billing date (if paid) */
    nextBillingDate: Date | null;

    /** Subscription expiry date */
    expiresAt: Date | null;
}

/**
 * Hook for accessing billing state and feature permissions
 * 
 * Core principle: This hook determines what the user can access,
 * ensuring core operations are NEVER blocked.
 */
export function useBillingState(): BillingStateData {
    const { user, primaryStore } = useAuthStore();

    const billingData = useMemo(() => {
        // Default to trial expired for safety
        if (!user || !primaryStore) {
            return {
                state: BillingState.TRIAL_EXPIRED,
                daysRemaining: 0,
                activeModules: [],
                isTrial: true,
                isPaid: false,
                isTrialActive: false,
                isTrialExpired: true,
                isPaymentOverdue: false,
                nextBillingDate: null,
                expiresAt: null,
            };
        }

        // Get subscription data from primary store
        // TODO: Replace with actual subscription data from API
        const subscription = {
            status: primaryStore.subscription?.status || 'trial',
            expiresAt: primaryStore.subscription?.trialEndsAt ? new Date(primaryStore.subscription.trialEndsAt) : null,
            isTrial: primaryStore.subscription?.plan === 'free' || !primaryStore.subscription?.plan,
            nextBillingDate: primaryStore.subscription?.nextBillingDate ? new Date(primaryStore.subscription.nextBillingDate) : null,
        };

        // Determine billing state
        const state = determineBillingState(subscription);

        // Calculate days remaining
        const daysRemaining = subscription.expiresAt
            ? calculateDaysRemaining(subscription.expiresAt)
            : 0;

        // Get active modules
        // TODO: Replace with actual module subscription data
        const activeModules = primaryStore.businessType
            ? Array.isArray(primaryStore.businessType)
                ? primaryStore.businessType.map((t: string) => t.toUpperCase())
                : [primaryStore.businessType.toUpperCase()]
            : ['RETAIL']; // Default to RETAIL

        return {
            state,
            daysRemaining,
            activeModules,
            isTrial: subscription.isTrial,
            isPaid: state === BillingState.PAID_ACTIVE,
            isTrialActive: state === BillingState.TRIAL_ACTIVE,
            isTrialExpired: state === BillingState.TRIAL_EXPIRED,
            isPaymentOverdue: state === BillingState.PAYMENT_OVERDUE,
            nextBillingDate: subscription.nextBillingDate,
            expiresAt: subscription.expiresAt,
        };
    }, [user, primaryStore]);

    // Feature access checker
    const canUse = (feature: Feature): boolean => {
        return canAccessFeature(feature, billingData.state, billingData.activeModules);
    };

    return {
        ...billingData,
        canUse,
    };
}
