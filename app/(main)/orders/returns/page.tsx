'use client';

import React, { useState, useEffect } from 'react';
import ReturnForm, { ReturnData } from '@/components/orders/ReturnForm';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge';
import { HiOutlineArrowUturnLeft, HiOutlineCheckCircle, HiOutlineCurrencyRupee } from 'react-icons/hi2';
import { FiPlus } from 'react-icons/fi';

interface ReturnRequest {
    id: string;
    poNumber: string;
    supplier: string;
    date: string;
    items: number;
    amount: number;
    status: 'pending' | 'approved' | 'completed';
    reason: string;
}

const StatCardSkeleton = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg h-9 w-9"></div>
            <div>
                <div className="text-sm h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="text-xl h-7 bg-gray-300 rounded w-12"></div>
            </div>
        </div>
    </div>
)

const ReturnRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
    </tr>
)

export default function ReturnsPage() {
    const [showForm, setShowForm] = useState(false);
    const [returns, setReturns] = useState<ReturnRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setReturns([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const handleSubmitReturn = (returnData: ReturnData) => {
        // TODO: Implement when backend API is ready
        // POST /api/v1/returns
        console.log('Return request:', returnData);
        alert('Returns API not yet implemented. Backend endpoints needed.');
        setShowForm(false);
    };

    // Calculate stats
    const pendingReturns = returns.filter(r => r.status === 'pending').length;
    const completedReturns = returns.filter(r => r.status === 'completed').length;
    const totalValue = returns.reduce((sum, r) => sum + r.amount, 0);

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, 'pending' | 'sent' | 'received'> = {
            pending: 'pending',
            approved: 'sent',
            completed: 'received'
        };
        return <OrderStatusBadge status={statusMap[status] || 'pending'} />;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage product returns to suppliers
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    disabled={isLoading}
                >
                    <FiPlus size={18} />
                    New Return Request
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <HiOutlineArrowUturnLeft className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Pending Returns</div>
                                    <div className="text-xl font-semibold text-gray-900">{pendingReturns}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Completed</div>
                                    <div className="text-xl font-semibold text-gray-900">{completedReturns}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <HiOutlineCurrencyRupee className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Value</div>
                                    <div className="text-xl font-semibold text-gray-900">
                                        ₹{(totalValue / 1000).toFixed(1)}K
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Returns Table */}
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
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <>
                                    <ReturnRowSkeleton />
                                    <ReturnRowSkeleton />
                                    <ReturnRowSkeleton />
                                </>
                            ) : returns.length > 0 ? (
                                returns.map((returnReq) => (
                                    <tr key={returnReq.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {returnReq.poNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {returnReq.supplier}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(returnReq.date).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {returnReq.items}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ₹{returnReq.amount.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {returnReq.reason}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(returnReq.status)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-gray-500">No return requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Return Form Modal */}
            {showForm && (
                <ReturnForm
                    onSubmit={handleSubmitReturn}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
