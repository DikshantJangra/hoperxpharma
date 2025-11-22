'use client';

import React, { useState, useEffect } from 'react';
import OrderList, { Order } from '@/components/orders/OrderList';
import OrderFilters, { FilterState } from '@/components/orders/OrderFilters';
import { HiOutlineCheckCircle, HiOutlineCurrencyRupee, HiOutlineClock } from 'react-icons/hi2';

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

export default function ReceivedOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setOrders([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    const handleFilterChange = (filters: FilterState) => {
        // This would refetch data with new filters
        console.log(filters);
    };

    const handleView = (order: Order) => {
        alert(`View order: ${order.poNumber}`);
    };

    // Calculate stats
    const receivedThisMonth = orders.filter(order => {
        const orderDate = new Date(order.date);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
    }).length;

    const totalValue = orders.reduce((sum, order) => sum + order.amount, 0);

    const avgDeliveryTime = 0; // Mock calculation, would be fetched

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Received Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                    View all received purchase orders and inventory updates
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {isLoading ? (
                    <>
                        <StatCardSkeleton/>
                        <StatCardSkeleton/>
                        <StatCardSkeleton/>
                    </>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Received This Month</div>
                                    <div className="text-xl font-semibold text-gray-900">{receivedThisMonth}</div>
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

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <HiOutlineClock className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Avg Delivery Time</div>
                                    <div className="text-xl font-semibold text-gray-900">{avgDeliveryTime} days</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters */}
            <OrderFilters onFilterChange={handleFilterChange} disabled={isLoading} />

            {/* Orders List */}
            <OrderList orders={orders} onView={handleView} loading={isLoading} />
        </div>
    );
}
