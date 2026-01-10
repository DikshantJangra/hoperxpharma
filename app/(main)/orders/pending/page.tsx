
'use client';

import React, { useState, useEffect } from 'react';
import OrderList from '@/components/orders/OrderList';
import OrderFilters, { FilterState } from '@/components/orders/OrderFilters';
import { HiOutlineClock, HiOutlineExclamationCircle, HiOutlineCalendar, HiOutlinePlus } from 'react-icons/hi2';
import { HiOutlineRefresh } from 'react-icons/hi';
import { Order } from '@/components/orders/OrderList';
import { tokenManager } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { purchaseOrderApi } from '@/lib/api/purchaseOrders';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Toast from '@/components/ui/Toast';

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
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; order: Order | null }>({
        isOpen: false,
        order: null
    });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchPendingOrders();
    }, [])

    const fetchPendingOrders = async () => {
        setIsLoading(true);
        try {
            const result = await purchaseOrderApi.getPurchaseOrders({
                status: 'DRAFT,SENT,PARTIALLY_RECEIVED',
                limit: 100
            });

            // Handle both array response and {data: array} response
            const fetchedOrders = Array.isArray(result) ? result : (result?.data || []);

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
        } catch (error) {
            console.error('[PendingOrders] Failed to fetch pending orders:', error);
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

    const handleReceive = (order: Order) => {
        router.push(`/orders/pending/${order.id}/receive`);
    };

    const handleEdit = (order: Order) => {
        router.push(`/orders/new-po?id=${order.id}`);
    };

    const handleDelete = (order: Order) => {
        setDeleteConfirm({ isOpen: true, order });
    };

    const confirmDelete = async () => {
        const order = deleteConfirm.order;
        if (!order) return;

        setDeleteConfirm({ isOpen: false, order: null });

        try {
            await purchaseOrderApi.deletePO(order.id);

            // Show success toast
            setToast({
                message: `Purchase order ${order.poNumber} has been deleted successfully.`,
                type: 'success'
            });

            // Refresh the orders list
            await fetchPendingOrders();
        } catch (error: any) {
            console.error('Failed to delete purchase order:', error);
            setToast({
                message: error.message || 'Failed to delete purchase order. Please try again.',
                type: 'error'
            });
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ isOpen: false, order: null });
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">To Receive</h1>
                    <p className="text-sm text-gray-500 mt-1">Purchase orders awaiting delivery and receiving</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/orders/new-po')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <HiOutlinePlus className="h-5 w-5" />
                        New Order
                    </button>
                    <button
                        onClick={fetchPendingOrders}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <HiOutlineRefresh className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
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
                onDelete={handleDelete}
                loading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Purchase Order"
                message={`Are you sure you want to delete PO ${deleteConfirm.order?.poNumber}?\n\nThis action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />

            {/* Toast Notifications */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}
        </div>
    );
}
