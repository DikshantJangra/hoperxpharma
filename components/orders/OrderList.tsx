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
    loading?: boolean;
    onView?: (order: Order) => void;
    onEdit?: (order: Order) => void;
    showActions?: boolean;
}

export default function OrderList({ orders, loading = false, onView, onEdit, showActions = true }: OrderListProps) {
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
                        {loading ? (
                            // Loading rows
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded-full"></div></td>
                                    {showActions && <td className="px-6 py-4"><div className="h-8 w-16 bg-gray-100 rounded ml-auto"></div></td>}
                                </tr>
                            ))
                        ) : (
                            orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{order.poNumber}</td>
                                        <td className="px-6 py-4 text-gray-600">{formatDate(order.date)}</td>
                                        <td className="px-6 py-4 text-gray-900">{order.supplier}</td>
                                        <td className="px-6 py-4 text-gray-600">{order.items}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(order.amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                order.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        {showActions && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => onView?.(order)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                        <FiEye size={16} />
                                                    </button>
                                                    <button onClick={() => onEdit?.(order)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={showActions ? 7 : 6} className="px-6 py-8 text-center text-gray-500">
                                        No orders found
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

