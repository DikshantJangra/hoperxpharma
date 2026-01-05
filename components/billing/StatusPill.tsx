'use client';

import { FiClock, FiAlertCircle } from 'react-icons/fi';
import { useBillingState } from '@/lib/hooks/useBillingState';
import { BillingState } from '@/lib/constants/billing-states';
import { useRouter } from 'next/navigation';

/**
 * StatusPill - Top-right billing status indicator
 * 
 * Design principles:
 * - Calm, non-intrusive
 * - Neutral colors (no red alerts)
 * - Hidden when fully paid
 * - Small, pill-shaped
 */
export function StatusPill() {
    const router = useRouter();
    const { state, daysRemaining, isPaid } = useBillingState();

    // Don't show anything for paid users
    if (isPaid) {
        return null;
    }

    // Render based on state
    const renderContent = () => {
        switch (state) {
            case BillingState.TRIAL_ACTIVE:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                        <FiClock className="w-3.5 h-3.5" />
                        <span>Trial ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
                    </button>
                );

            case BillingState.TRIAL_EXPIRED:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-amber-100 transition-colors border border-amber-200"
                    >
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>Trial expired</span>
                    </button>
                );

            case BillingState.PAYMENT_OVERDUE:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-orange-100 transition-colors border border-orange-200"
                    >
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>Subscription inactive</span>
                    </button>
                );

            default:
                return null;
        }
    };

    return <div className="flex items-center">{renderContent()}</div>;
}
