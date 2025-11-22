import React from 'react';
import Link from 'next/link';
import OrderStatusBadge from './OrderStatusBadge';
import { FiEye, FiEdit2, FiDownload } from 'react-icons/fi';

export interface Order {
    id: string;
    poNumber: string;
    supplier: string;
    date: string;
    amount: number;
    status: 'draft' | 'pending' | 'sent' | 'received' | 'cancelled' | 'partial';
    items: number;
    expectedDelivery?: string;
}

interface OrderListProps {
    orders: Order[];
    onView?: (order: Order) => void;
    onEdit?: (order: Order) => void;
    showActions?: boolean;
}

export default function OrderList({ orders, onView, onEdit, showActions = true }: OrderListProps) {
    const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-2">
                    <FiDownload size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new purchase order.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                PO Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            {showActions && (
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{order.poNumber}</div>
                                    {order.expectedDelivery && (
                                        <div className="text-xs text-gray-500">
                                            Expected: {formatDate(order.expectedDelivery)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {order.supplier}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(order.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.items}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatCurrency(order.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                {showActions && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onView?.(order)}
                                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                title="View Order"
                                            >
                                                <FiEye size={16} />
                                            </button>
                                            {order.status === 'draft' && (
                                                <button
                                                    onClick={() => onEdit?.(order)}
                                                    className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded transition-colors"
                                                    title="Edit Order"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
