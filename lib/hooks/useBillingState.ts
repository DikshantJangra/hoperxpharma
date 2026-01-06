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
        const subscription = primaryStore.subscription;
        const statusLower = (subscription?.status || 'trial').toLowerCase();

        // Build subscription state object
        const subState = {
            status: statusLower,
            expiresAt: subscription?.trialEndsAt
                ? new Date(subscription.trialEndsAt)
                : subscription?.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd)
                    : null,
            // isTrial is false if status is ACTIVE or PAID
            isTrial: statusLower === 'trial' || !subscription?.status,
            nextBillingDate: subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd)
                : null,
        };

        // Determine billing state
        const state = determineBillingState(subState);

        // Calculate days remaining
        const daysRemaining = subState.expiresAt
            ? calculateDaysRemaining(subState.expiresAt)
            : 0;

        // Get active modules from subscription's activeVerticals (new schema)
        // Falls back to businessType for backward compatibility
        let activeModules: string[] = [];

        if (subscription?.activeVerticals && subscription.activeVerticals.length > 0) {
            // Use new vertical-based subscription fields
            activeModules = subscription.activeVerticals.map((v: string) => v.toUpperCase());
        } else if (primaryStore.businessType) {
            // Fallback for backward compat
            activeModules = Array.isArray(primaryStore.businessType)
                ? primaryStore.businessType.map((t: string) => t.toUpperCase())
                : [primaryStore.businessType.toUpperCase()];
        } else {
            // Default to RETAIL
            activeModules = ['RETAIL'];
        }

        return {
            state,
            daysRemaining,
            activeModules,
            isTrial: subState.isTrial,
            isPaid: state === BillingState.PAID_ACTIVE,
            isTrialActive: state === BillingState.TRIAL_ACTIVE,
            isTrialExpired: state === BillingState.TRIAL_EXPIRED,
            isPaymentOverdue: state === BillingState.PAYMENT_OVERDUE,
            nextBillingDate: subState.nextBillingDate,
            expiresAt: subState.expiresAt,
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
