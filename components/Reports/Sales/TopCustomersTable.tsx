'use client';

import React from 'react';
import { TopCustomer } from '@/lib/api/salesAnalytics';

interface TopCustomersTableProps {
    customers: TopCustomer[];
    onCustomerClick?: (customer: TopCustomer) => void;
}

export default function TopCustomersTable({ customers, onCustomerClick }: TopCustomersTableProps) {
    if (!customers || customers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h3>
                <div className="text-center text-gray-500 py-8">
                    <p>No customer data available</p>
                </div>
            </div>
        );
    }

    const getLoyaltyBadge = (status: string) => {
        const statusMap: Record<string, { label: string; color: string }> = {
            NEW: { label: 'New', color: 'bg-gray-100 text-gray-700' },
            REGULAR: { label: 'Regular', color: 'bg-blue-100 text-blue-700' },
            TRUSTED: { label: 'Trusted', color: 'bg-purple-100 text-purple-700' },
            INSIDER: { label: 'Insider', color: 'bg-indigo-100 text-indigo-700' },
            ADVOCATE: { label: 'Advocate', color: 'bg-pink-100 text-pink-700' }
        };

        const badge = statusMap[status] || statusMap.NEW;
        return (
            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Total Spend
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Orders
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Avg Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Last Visit
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                            <tr
                                key={customer.customerId}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => onCustomerClick?.(customer)}
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold text-gray-900">{customer.customerName}</div>
                                        <div className="text-sm text-gray-500">{customer.phoneNumber}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-semibold text-gray-900 tabular-nums">
                                        ₹{customer.totalSpend.toLocaleString('en-IN')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-gray-900 tabular-nums">
                                        {customer.orders}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-gray-900 tabular-nums">
                                        ₹{customer.avgOrderValue.toLocaleString('en-IN')}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                        {formatDate(customer.lastVisit)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        {getLoyaltyBadge(customer.loyaltyStatus)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
