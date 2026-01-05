'use client';

import { useState, useEffect } from 'react';
import { FiX, FiInfo } from 'react-icons/fi';
import { useBillingState } from '@/lib/hooks/useBillingState';
import { BillingState } from '@/lib/constants/billing-states';
import { useRouter } from 'next/navigation';

/**
 * TrialBanner - Soft banner for trial expired state
 * 
 * Design principles:
 * - Shows once per session
 * - Dismissible
 * - Reassuring tone ("Core billing still works")
 * - Calm colors (amber, not red)
 */
export function TrialBanner() {
    const router = useRouter();
    const { state, isPaymentOverdue } = useBillingState();
    const [dismissed, setDismissed] = useState(false);

    // Check if banner was dismissed in this session
    // useEffect(() => {
    //     const sessionKey = 'trial-banner-dismissed';
    //     const wasDismissed = sessionStorage.getItem(sessionKey);
    //     if (wasDismissed) {
    //         setDismissed(true);
    //     }
    // }, []);

    const handleDismiss = () => {
        setDismissed(true);
        // sessionStorage.setItem('trial-banner-dismissed', 'true');
    };

    const handleViewPlans = () => {
        router.push('/store/billing');
    };

    // Only show for trial expired
    if (state !== BillingState.TRIAL_EXPIRED || dismissed) {
        return null;
    }

    return (
        <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FiInfo className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-amber-900">
                                <span className="font-medium">Your trial has ended.</span>{' '}
                                <span className="text-amber-700">Core billing still works.</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleViewPlans}
                            className="text-sm font-medium text-amber-900 hover:text-amber-800 px-4 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                        >
                            View Plans
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-amber-600 hover:text-amber-800 p-1.5 hover:bg-amber-100 rounded-lg transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * PaymentOverdueBanner - Persistent banner for overdue payments
 * 
 * Design principles:
 * - NOT dismissible (more urgent)
 * - Still calm tone
 * - Orange/amber colors (not red)
 * - Clear CTA
 */
export function PaymentOverdueBanner() {
    const router = useRouter();
    const { state } = useBillingState();

    // Only show for payment overdue
    if (state !== BillingState.PAYMENT_OVERDUE) {
        return null;
    }

    return (
        <div className="bg-orange-50 border-b border-orange-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FiInfo className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-orange-900">
                                <span className="font-medium">Subscription inactive.</span>{' '}
                                <span className="text-orange-700">Some features are limited.</span>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push('/profile')}
                        className="text-sm font-medium text-orange-900 hover:text-orange-800 px-4 py-1.5 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                        Update Payment
                    </button>
                </div>
            </div>
        </div>
    );
}
