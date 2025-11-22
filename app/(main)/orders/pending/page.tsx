'use client';

import React, { useState } from 'react';
import OrderList, { Order } from '@/components/orders/OrderList';
import OrderFilters, { FilterState } from '@/components/orders/OrderFilters';
import { HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCalendar } from 'react-icons/hi2';

// Mock data
const mockOrders: Order[] = [
    {
        id: '1',
        poNumber: 'PO-2025-000125',
        supplier: 'ABC Pharma Distributors',
        date: '2025-11-18',
        amount: 67800,
        status: 'sent',
        items: 12,
        expectedDelivery: '2025-11-25'
    },
    {
        id: '2',
        poNumber: 'PO-2025-000124',
        supplier: 'MediCore Supplies',
        date: '2025-11-15',
        amount: 45200,
        status: 'sent',
        items: 8,
        expectedDelivery: '2025-11-22'
    },
    {
        id: '3',
        poNumber: 'PO-2025-000122',
        supplier: 'HealthPlus Distributors',
        date: '2025-11-10',
        amount: 89500,
        status: 'sent',
        items: 15,
        expectedDelivery: '2025-11-20'
    }
];

export default function PendingOrdersPage() {
    const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);

    const handleFilterChange = (filters: FilterState) => {
        let filtered = [...mockOrders];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                order =>
                    order.poNumber.toLowerCase().includes(searchLower) ||
                    order.supplier.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === filters.status);
        }

        // Supplier filter
        if (filters.supplier !== 'all') {
            filtered = filtered.filter(order =>
                order.supplier.toLowerCase().includes(filters.supplier.toLowerCase())
            );
        }

        // Date filters
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
    const totalPending = mockOrders.length;
    const overdue = mockOrders.filter(order => {
        if (!order.expectedDelivery) return false;
        return new Date(order.expectedDelivery) < new Date();
    }).length;
    const expectedThisWeek = mockOrders.filter(order => {
        if (!order.expectedDelivery) return false;
        const expected = new Date(order.expectedDelivery);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return expected <= weekFromNow && expected >= new Date();
    }).length;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pending Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track purchase orders awaiting delivery
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <HiOutlineClock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Total Pending</div>
                            <div className="text-xl font-semibold text-gray-900">{totalPending}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <HiOutlineExclamationCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Overdue</div>
                            <div className="text-xl font-semibold text-gray-900">{overdue}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <HiOutlineCalendar className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Expected This Week</div>
                            <div className="text-xl font-semibold text-gray-900">{expectedThisWeek}</div>
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
