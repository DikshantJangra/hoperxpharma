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

// Helper to normalize status string
const normalizeStatus = (status: string | undefined | null): OrderStatus => {
    if (!status) return 'draft';

    const lowerStatus = status.toLowerCase();

    // Map backend statuses to frontend badge statuses
    if (lowerStatus === 'completed') return 'received';
    if (lowerStatus === 'partially_received') return 'partial';
    if (lowerStatus === 'in_progress') return 'pending';

    // Check if it's a valid key
    if (statusConfig[lowerStatus as OrderStatus]) {
        return lowerStatus as OrderStatus;
    }

    return 'draft'; // Fallback
};

export default function OrderStatusBadge({ status, className = '' }: { status: string; className?: string }) {
    const normalizedStatus = normalizeStatus(status);
    const config = statusConfig[normalizedStatus] || statusConfig.draft;

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
        >
            {config.label}
        </span>
    );
}
