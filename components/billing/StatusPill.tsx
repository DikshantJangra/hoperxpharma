'use client';

import { FiClock, FiAlertCircle } from 'react-icons/fi';
import { TbDiamondFilled } from 'react-icons/tb';
import { useBillingState } from '@/lib/hooks/useBillingState';
import { BillingState } from '@/lib/constants/billing-states';
import { useRouter } from 'next/navigation';

interface StatusPillProps {
    isPremium?: boolean;
}

/**
 * StatusPill - Top-right billing status indicator
 * 
 * Design principles:
 * - Calm, non-intrusive
 * - Shows "✨ Pro" badge for paid users (premium navbar)
 * - Shows trial countdown for trial users
 * - Small, pill-shaped
 */
export function StatusPill({ isPremium }: StatusPillProps) {
    const router = useRouter();
    const { state, daysRemaining, isPaid } = useBillingState();

    // For paid users: Show "Pro" badge with shimmer effect
    if (isPaid) {
        return (
            <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${isPremium
                        ? 'bg-white/10 backdrop-blur-md border-white/20 text-white shadow-lg shadow-black/5 animate-shimmer-premium'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent'
                    }`}
            >
                <TbDiamondFilled className="w-3 h-3 text-emerald-200" />
                <span className="tracking-wide">PRO</span>
            </div>
        );
    }

    // Render based on state for non-paid users
    const renderContent = () => {
        switch (state) {
            case BillingState.TRIAL_ACTIVE:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isPremium
                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                    >
                        <FiClock className="w-3.5 h-3.5" />
                        <span>Trial ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span>
                    </button>
                );

            case BillingState.TRIAL_EXPIRED:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isPremium
                            ? 'bg-amber-500/20 text-white border-amber-200/20 hover:bg-amber-500/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            }`}
                    >
                        <FiAlertCircle className="w-3.5 h-3.5" />
                        <span>Trial expired</span>
                    </button>
                );

            case BillingState.PAYMENT_OVERDUE:
                return (
                    <button
                        onClick={() => router.push('/store/billing')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isPremium
                            ? 'bg-orange-500/20 text-white border-orange-200/20 hover:bg-orange-500/30'
                            : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                            }`}
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

