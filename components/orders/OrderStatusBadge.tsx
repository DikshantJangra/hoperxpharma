import React from 'react';

type OrderStatus = 'draft' | 'pending' | 'sent' | 'received' | 'cancelled' | 'partial';

interface OrderStatusBadgeProps {
    status: OrderStatus;
    className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; textColor: string }> = {
    draft: {
        label: 'Draft',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
    },
    pending: {
        label: 'Pending',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800'
    },
    sent: {
        label: 'Sent',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
    },
    received: {
        label: 'Received',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
    },
    cancelled: {
        label: 'Cancelled',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
    },
    partial: {
        label: 'Partial',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800'
    }
};

export default function OrderStatusBadge({ status, className = '' }: OrderStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
        >
            {config.label}
        </span>
    );
}
