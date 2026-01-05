'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

export type UrgencyLevel = 'calm' | 'warm' | 'urgent' | 'expired';

export interface TrialStatus {
    isOnTrial: boolean;
    daysLeft: number;
    totalDays: number;
    urgency: UrgencyLevel;
    progress: number; // 0-100
}

/**
 * Hook to get trial status from the primary store
 * Returns trial info including days remaining and urgency level
 */
export function useTrialStatus(): TrialStatus {
    const { primaryStore } = useAuthStore();

    return useMemo(() => {
        const TRIAL_LENGTH = 14;

        // If no store or store has active subscription, not on trial
        if (!primaryStore) {
            return {
                isOnTrial: false,
                daysLeft: 0,
                totalDays: TRIAL_LENGTH,
                urgency: 'expired' as UrgencyLevel,
                progress: 100,
            };
        }

        // TODO: Check for active subscription status when implemented
        // For now, assume all stores are on trial unless subscriptionStatus is 'ACTIVE'
        const subscriptionStatus = (primaryStore as any).subscriptionStatus;
        if (subscriptionStatus === 'ACTIVE' || subscriptionStatus === 'ENTERPRISE') {
            return {
                isOnTrial: false,
                daysLeft: 0,
                totalDays: TRIAL_LENGTH,
                urgency: 'calm' as UrgencyLevel,
                progress: 0,
            };
        }

        // Calculate days since store creation
        const createdAt = primaryStore.createdAt ? new Date(primaryStore.createdAt) : new Date();
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, TRIAL_LENGTH - daysPassed);
        const progress = ((TRIAL_LENGTH - daysLeft) / TRIAL_LENGTH) * 100;

        // Determine urgency level based on days remaining
        let urgency: UrgencyLevel;
        if (daysLeft === 0) {
            urgency = 'expired';
        } else if (daysLeft <= 3) {
            urgency = 'urgent';
        } else if (daysLeft <= 7) {
            urgency = 'warm';
        } else {
            urgency = 'calm';
        }

        return {
            isOnTrial: true,
            daysLeft,
            totalDays: TRIAL_LENGTH,
            urgency,
            progress,
        };
    }, [primaryStore]);
}

/**
 * Get Tailwind classes for urgency-based colors
 */
export function getUrgencyColors(urgency: UrgencyLevel) {
    switch (urgency) {
        case 'calm':
            return {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                text: 'text-emerald-700',
                dot: 'bg-emerald-500',
                gradient: 'from-emerald-400 to-emerald-500',
            };
        case 'warm':
            return {
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                text: 'text-amber-700',
                dot: 'bg-amber-500',
                gradient: 'from-amber-400 to-orange-500',
            };
        case 'urgent':
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                dot: 'bg-red-500',
                gradient: 'from-red-400 to-red-500',
            };
        case 'expired':
        default:
            return {
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                text: 'text-gray-600',
                dot: 'bg-gray-400',
                gradient: 'from-gray-400 to-gray-500',
            };
    }
}
