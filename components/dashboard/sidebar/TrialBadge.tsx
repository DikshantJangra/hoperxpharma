'use client';

import Link from 'next/link';
import { FiClock, FiArrowRight, FiAlertTriangle } from 'react-icons/fi';
import { useTrialStatus, getUrgencyColors } from '@/lib/hooks/useTrialStatus';

interface TrialBadgeProps {
    isOpen: boolean;
}

/**
 * Trial badge component for sidebar footer
 * Shows days remaining and link to upgrade
 */
export function TrialBadge({ isOpen }: TrialBadgeProps) {
    const { isOnTrial, daysLeft, urgency } = useTrialStatus();
    const colors = getUrgencyColors(urgency);
    const isExpired = daysLeft === 0;

    // Don't show if not on trial
    if (!isOnTrial) return null;

    // Collapsed state - just show icon with color
    if (!isOpen) {
        return (
            <Link
                href="/store/billing"
                className={`mx-3 mb-4 p-2 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center transition-all hover:scale-105 ${isExpired ? 'animate-pulse' : ''}`}
                title={isExpired ? 'Trial expired - Activate now' : `${daysLeft} days left in trial`}
            >
                {isExpired ? (
                    <FiAlertTriangle className={`w-5 h-5 ${colors.text}`} />
                ) : (
                    <FiClock className={`w-5 h-5 ${colors.text}`} />
                )}
            </Link>
        );
    }

    // Expired state - more urgent styling
    if (isExpired) {
        return (
            <Link
                href="/store/billing"
                className="mx-3 mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-300 flex items-center justify-between gap-3 transition-all hover:shadow-md hover:bg-red-100 group animate-pulse"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                        <FiAlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-red-700">
                            Trial Expired
                        </p>
                        <p className="text-[10px] text-red-600 font-medium truncate">
                            Activate to continue
                        </p>
                    </div>
                </div>
                <FiArrowRight className="w-4 h-4 text-red-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
        );
    }

    // Expanded state - full badge with days remaining
    return (
        <Link
            href="/store/billing"
            className={`mx-3 mb-4 p-3 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-between gap-3 transition-all hover:shadow-md group`}
        >
            <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                    <FiClock className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <p className={`text-xs font-bold ${colors.text}`}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                        {urgency === 'urgent' ? 'Upgrade now!' : 'Free Trial'}
                    </p>
                </div>
            </div>
            <FiArrowRight className={`w-4 h-4 ${colors.text} group-hover:translate-x-0.5 transition-transform flex-shrink-0`} />
        </Link>
    );
}

