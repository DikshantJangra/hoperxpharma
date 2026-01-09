'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import type { WelcomeState, SubscriptionData } from '@/lib/types/welcome.types';
import { apiClient } from '@/lib/api/client';

/**
 * Premium Post-Payment Welcome Experience Hook
 * Detects eligibility and manages welcome state
 * 
 * Core principle: Backend truth drives the experience
 */
export function useWelcomeExperience() {
    const { user } = useAuthStore();
    const [welcomeState, setWelcomeState] = useState<WelcomeState>({
        shouldShow: false,
        isActive: false,
        currentSection: null,
        subscriptionData: null,
    });

    /**
     * Check welcome eligibility
     * Only shows if:
     * - Subscription is ACTIVE
     * - Welcome has not been shown
     * - Payment is verified
     */
    const checkEligibility = useCallback(async () => {
        try {
            // Fetch subscription state using apiClient (handles auth tokens automatically)
            const response = await apiClient.get('/subscriptions/status');
            const subscription = response.data;

            // Check eligibility
            const isActive = subscription?.status === 'ACTIVE';
            const wasShown = subscription?.welcomeShown === true;
            const isVerified = subscription?.paymentVerified !== false;

            const eligible = isActive && !wasShown && isVerified && !!subscription.id;

            if (eligible) {
                // Transform subscription data for display
                const subscriptionData: SubscriptionData = {
                    id: subscription.id,
                    planName: subscription.plan?.displayName || subscription.plan?.name || 'HopeRx Premium',
                    status: subscription.status,
                    activatedAt: subscription.currentPeriodStart || new Date().toISOString(),
                    billingCycle: subscription.billingCycle || 'monthly',
                };

                setWelcomeState({
                    shouldShow: true,
                    isActive: false, // Not active yet, just eligible
                    currentSection: null,
                    subscriptionData,
                });
            }
        } catch (error) {
            console.error('[Welcome] Eligibility check failed:', error);
            setWelcomeState(prev => ({
                ...prev,
                error: 'Failed to verify welcome eligibility',
            }));
        }
    }, []);

    /**
     * Mark welcome as shown
     * Idempotent - safe to call multiple times
     */
    const markAsShown = useCallback(async () => {
        if (!welcomeState.subscriptionData) return;

        try {
            await apiClient.post(`/subscriptions/${welcomeState.subscriptionData.id}/mark-welcome-shown`);

            // Hide welcome regardless of API call result
            setWelcomeState(prev => ({
                ...prev,
                shouldShow: false,
                isActive: false,
                currentSection: null,
            }));
        } catch (error) {
            console.error('[Welcome] Mark as shown failed:', error);
            // Still hide welcome
            setWelcomeState(prev => ({
                ...prev,
                shouldShow: false,
                isActive: false,
            }));
        }
    }, [welcomeState.subscriptionData]);

    /**
     * Activate welcome (start showing)
     */
    const activateWelcome = useCallback(() => {
        setWelcomeState(prev => ({
            ...prev,
            isActive: true,
            currentSection: 'arrival',
        }));
    }, []);

    /**
     * Skip welcome
     */
    const skipWelcome = useCallback(() => {
        markAsShown();
    }, [markAsShown]);

    // Check eligibility on mount
    useEffect(() => {
        checkEligibility();
    }, [checkEligibility]);

    return {
        shouldShow: welcomeState.shouldShow,
        isActive: welcomeState.isActive,
        currentSection: welcomeState.currentSection,
        subscriptionData: welcomeState.subscriptionData,
        error: welcomeState.error,
        activateWelcome,
        markAsShown,
        skipWelcome,
    };
}
