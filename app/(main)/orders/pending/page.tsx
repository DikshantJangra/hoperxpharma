
'use client';

import React, { useState, useEffect } from 'react';
import OrderList from '@/components/orders/OrderList';
import OrderFilters, { FilterState } from '@/components/orders/OrderFilters';
import { HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCalendar } from 'react-icons/hi2';
import { HiOutlineRefresh } from 'react-icons/hi'; // Added HiOutlineRefresh
import { Order } from '@/components/orders/OrderList'; // Changed Order import source
import { tokenManager } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

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

export default function PendingOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchPendingOrders();
    }, [])

    const fetchPendingOrders = async () => {
        setIsLoading(true);
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const token = tokenManager.getAccessToken();
            const response = await fetch(`${apiBaseUrl}/purchase-orders?status=SENT,PARTIALLY_RECEIVED&limit=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const fetchedOrders = Array.isArray(result.data) ? result.data : [];

                // Transform to Order format
                const transformedOrders: Order[] = fetchedOrders.map((po: any) => ({
                    id: po.id,
                    poNumber: po.poNumber,
                    supplier: po.supplier?.name || 'Unknown',
                    date: po.createdAt,
                    amount: Number(po.total),
                    status: po.status.toLowerCase() as any,
                    expectedDelivery: po.expectedDeliveryDate
                }));

                setOrders(transformedOrders);
            }
        } catch (error) {
            console.error('Failed to fetch pending orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (filters: FilterState) => {
        // This would refetch data with new filters
        console.log(filters)
    };

    const handleView = (order: Order) => {
        router.push(`/orders/${order.id}`);
    };

    const handleReceive = (order: Order) => { // Updated signature to take Order object
        router.push(`/orders/pending/${order.id}/receive`);
    };

    const handleEdit = (order: Order) => {
        router.push(`/orders/pending/${order.id}/edit`);
    };

    // Calculate stats from the fetched orders
    const totalPending = orders.length;
    const totalValue = orders.reduce((sum, order) => sum + order.amount, 0);
    const expectedThisWeek = orders.filter(o => {
        const date = new Date(o.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    }).length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
                <button
                    onClick={fetchPendingOrders}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    <HiOutlineRefresh className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <HiOutlineClock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Pending</div>
                                    <div className="text-xl font-semibold text-gray-900">{totalPending}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <HiOutlineExclamationCircle className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Total Value</div>
                                    <div className="text-xl font-semibold text-gray-900">₹{totalValue.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-emerald-50 rounded-lg">
                                    <HiOutlineCalendar className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Expected This Week</div>
                                    <div className="text-xl font-semibold text-gray-900">{expectedThisWeek}</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
            <OrderFilters onFilterChange={handleFilterChange} disabled={isLoading} />

            {/* Orders List */}
            <OrderList
                orders={orders}
                onView={handleView}
                onReceive={handleReceive}
                onEdit={handleEdit}
                loading={isLoading}
            />
        </div>
    );
}
