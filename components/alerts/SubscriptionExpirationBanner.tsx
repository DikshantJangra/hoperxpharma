'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiX, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import type { ExpirationAlert } from '@/lib/types/expiration.types';

interface SubscriptionExpirationBannerProps {
    alert: ExpirationAlert;
    onDismiss?: () => void;
}

/**
 * Subscription Expiration Banner
 * Sticky top banner with escalating urgency based on severity
 */
export function SubscriptionExpirationBanner({
    alert,
    onDismiss
}: SubscriptionExpirationBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    const handleDismiss = () => {
        if (alert.dismissible && onDismiss) {
            setDismissed(true);
            onDismiss();
        }
    };

    const severityConfig = getSeverityConfig(alert.severity);

    return (
        <div
            className={`sticky top-0 z-40 ${severityConfig.bgClass} ${severityConfig.borderClass} border-b`}
            role="alert"
        >
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4">
                    {/* Icon + Message */}
                    <div className="flex items-center gap-3 flex-1">
                        <severityConfig.icon className={`w-5 h-5 flex-shrink-0 ${severityConfig.iconClass}`} />

                        <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-sm ${severityConfig.textClass}`}>
                                {alert.title}
                            </p>
                            <p className={`text-sm ${severityConfig.secondaryTextClass} mt-0.5`}>
                                {alert.message}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {alert.action.href ? (
                            <Link
                                href={alert.action.href}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${severityConfig.buttonClass}`}
                            >
                                {alert.action.label}
                            </Link>
                        ) : (
                            <button
                                onClick={alert.action.onClick}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${severityConfig.buttonClass}`}
                            >
                                {alert.action.label}
                            </button>
                        )}

                        {alert.dismissible && (
                            <button
                                onClick={handleDismiss}
                                className={`p-1.5 rounded hover:bg-black/5 transition-colors ${severityConfig.textClass}`}
                                aria-label="Dismiss"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Get styling configuration based on severity
 */
function getSeverityConfig(severity: ExpirationAlert['severity']) {
    const configs = {
        info: {
            icon: FiInfo,
            bgClass: 'bg-blue-50',
            borderClass: 'border-blue-100',
            textClass: 'text-blue-900',
            secondaryTextClass: 'text-blue-700',
            iconClass: 'text-blue-600',
            buttonClass: 'bg-blue-600 text-white hover:bg-blue-700',
        },
        warning: {
            icon: FiAlertTriangle,
            bgClass: 'bg-yellow-50',
            borderClass: 'border-yellow-100',
            textClass: 'text-yellow-900',
            secondaryTextClass: 'text-yellow-700',
            iconClass: 'text-yellow-600',
            buttonClass: 'bg-yellow-600 text-white hover:bg-yellow-700',
        },
        error: {
            icon: FiAlertCircle,
            bgClass: 'bg-orange-50',
            borderClass: 'border-orange-200',
            textClass: 'text-orange-900',
            secondaryTextClass: 'text-orange-700',
            iconClass: 'text-orange-600',
            buttonClass: 'bg-orange-600 text-white hover:bg-orange-700',
        },
        critical: {
            icon: FiAlertCircle,
            bgClass: 'bg-red-50',
            borderClass: 'border-red-200',
            textClass: 'text-red-900',
            secondaryTextClass: 'text-red-700',
            iconClass: 'text-red-600',
            buttonClass: 'bg-red-600 text-white hover:bg-red-700',
        },
    };

    return configs[severity];
}
