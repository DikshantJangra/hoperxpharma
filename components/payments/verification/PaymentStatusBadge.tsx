'use client';

import type { PaymentStatus } from '@/lib/types/payment-verification.types';
import { FiCheck, FiClock, FiX, FiAlertCircle } from 'react-icons/fi';

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export function PaymentStatusBadge({
    status,
    size = 'md',
    showIcon = true,
}: PaymentStatusBadgeProps) {
    const config = getStatusConfig(status);

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
        >
            {showIcon && (
                <config.icon className={iconSizes[size]} />
            )}
            {config.label}
        </span>
    );
}

function getStatusConfig(status: PaymentStatus) {
    const configs: Record<PaymentStatus, {
        icon: any;
        label: string;
        bgColor: string;
        textColor: string;
    }> = {
        CREATED: {
            icon: FiClock,
            label: 'Created',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700',
        },
        INITIATED: {
            icon: FiClock,
            label: 'Initiated',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
        },
        PROCESSING: {
            icon: FiClock,
            label: 'Processing',
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-700',
        },
        SUCCESS: {
            icon: FiCheck,
            label: 'Confirmed',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-700',
        },
        FAILED: {
            icon: FiX,
            label: 'Failed',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
        },
        EXPIRED: {
            icon: FiAlertCircle,
            label: 'Expired',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-600',
        },
        DISPUTED: {
            icon: FiAlertCircle,
            label: 'Disputed',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700',
        },
        REFUNDED: {
            icon: FiCheck,
            label: 'Refunded',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
        },
    };

    return configs[status] || configs.CREATED;
}
