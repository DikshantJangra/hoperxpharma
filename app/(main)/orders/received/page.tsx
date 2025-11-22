'use client';

import React, { useState } from 'react';
import OrderList, { Order } from '@/components/orders/OrderList';
import OrderFilters, { FilterState } from '@/components/orders/OrderFilters';
import { HiOutlineCheckCircle, HiOutlineCurrencyRupee, HiOutlineClock } from 'react-icons/hi2';

// Mock data
const mockOrders: Order[] = [
    {
        id: '1',
        poNumber: 'PO-2025-000123',
        supplier: 'ABC Pharma Distributors',
        date: '2025-11-14',
        amount: 45600,
        status: 'received',
        items: 10,
        expectedDelivery: '2025-11-20'
    },
    {
        id: '2',
        poNumber: 'PO-2025-000121',
        supplier: 'MediCore Supplies',
        date: '2025-11-12',
        amount: 32400,
        status: 'received',
        items: 7,
        expectedDelivery: '2025-11-18'
    },
    {
        id: '3',
        poNumber: 'PO-2025-000120',
        supplier: 'HealthPlus Distributors',
        date: '2025-11-10',
        amount: 78900,
        status: 'received',
        items: 14,
        expectedDelivery: '2025-11-17'
    },
    {
        id: '4',
        poNumber: 'PO-2025-000119',
        supplier: 'ABC Pharma Distributors',
        date: '2025-11-08',
        amount: 56700,
        status: 'partial',
        items: 9,
        expectedDelivery: '2025-11-15'
    }
];

export default function ReceivedOrdersPage() {
    const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);

    const handleFilterChange = (filters: FilterState) => {
        let filtered = [...mockOrders];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                order =>
                    order.poNumber.toLowerCase().includes(searchLower) ||
                    order.supplier.toLowerCase().includes(searchLower)
            );
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === filters.status);
        }

        if (filters.supplier !== 'all') {
            filtered = filtered.filter(order =>
                order.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
            );
        }

        if (filters.dateFrom) {
            filtered = filtered.filter(order => order.date >= filters.dateFrom);
        }
        if (filters.dateTo) {
            filtered = filtered.filter(order => order.date <= filters.dateTo);
        }

        setFilteredOrders(filtered);
    };

    const handleView = (order: Order) => {
        alert(`View order: ${order.poNumber}`);
    };

    // Calculate stats
    const receivedThisMonth = mockOrders.filter(order => {
        const orderDate = new Date(order.date);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear();
    }).length;

    const totalValue = mockOrders.reduce((sum, order) => sum + order.amount, 0);

    const avgDeliveryTime = 5; // Mock calculation

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
            </div>

            {/* Filters */}
            <OrderFilters onFilterChange={handleFilterChange} />

            {/* Orders List */}
            <OrderList orders={filteredOrders} onView={handleView} />
        </div>
    );
}
