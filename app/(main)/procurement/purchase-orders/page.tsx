'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';
import Link from 'next/link';

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        DRAFT: 'bg-gray-100 text-gray-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-blue-100 text-blue-700',
        PARTIALLY_RECEIVED: 'bg-purple-100 text-purple-700',
        RECEIVED: 'bg-green-100 text-green-700',
        CANCELLED: 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const PORowSkeleton = () => (
    <tr className="border-b border-gray-100 animate-pulse">
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-4 py-3 text-right"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
        <td className="px-4 py-3"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    </tr>
);

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const { purchaseOrderApi } = await import('@/lib/api/purchaseOrders');
                const [ordersResponse, statsResponse] = await Promise.all([
                    purchaseOrderApi.getPurchaseOrders({
                        page: 1,
                        limit: 50,
                        status: statusFilter === 'ALL' ? undefined : statusFilter,
                    }),
                    purchaseOrderApi.getStats(),
                ]);

                if (ordersResponse.success) {
                    setOrders(ordersResponse.data || []);
                }
                if (statsResponse.success) {
                    setStats(statsResponse.data);
                }
            } catch (error) {
                console.error('Failed to fetch purchase orders:', error);
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [statusFilter]);

    const filteredOrders = orders.filter(order =>
        order.poNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f172a]">Purchase Orders</h1>
                        <p className="text-sm text-[#64748b]">Procurement › Purchase Orders</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-2 border border-[#cbd5e1] rounded-lg hover:bg-[#f8fafc] flex items-center gap-2 text-sm">
                            <FiDownload className="w-4 h-4" />
                            Export
                        </button>
                        <Link
                            href="/procurement/purchase-orders/new"
                            className="px-3 py-2 bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] flex items-center gap-2 text-sm"
                        >
                            <FiPlus className="w-4 h-4" />
                            New PO
                        </Link>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94a3b8]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by PO number or supplier..."
                            className="w-full pl-10 pr-4 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    >
                        <option value="ALL">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PARTIALLY_RECEIVED">Partially Received</option>
                        <option value="RECEIVED">Received</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-[#f1f5f9] rounded-lg text-sm">
                            <span className="text-[#64748b]">Total POs:</span>{' '}
                            <span className="font-semibold text-[#0f172a]">{stats.totalPOs || 0}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-[#fef3c7] rounded-lg text-sm">
                            <span className="text-[#92400e]">Pending:</span>{' '}
                            <span className="font-semibold text-[#92400e]">{stats.pendingPOs || 0}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-[#dbeafe] rounded-lg text-sm">
                            <span className="text-[#1e40af]">Approved:</span>{' '}
                            <span className="font-semibold text-[#1e40af]">{stats.approvedPOs || 0}</span>
                        </div>
                        <div className="px-3 py-1.5 bg-[#d1fae5] rounded-lg text-sm">
                            <span className="text-[#065f46]">Received:</span>{' '}
                            <span className="font-semibold text-[#065f46]">{stats.receivedPOs || 0}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto bg-white">
                <table className="w-full">
                    <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] z-10">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">PO Number</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Supplier</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Order Date</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Items</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Total</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Status</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase">Expected Delivery</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <>
                                <PORowSkeleton />
                                <PORowSkeleton />
                                <PORowSkeleton />
                                <PORowSkeleton />
                                <PORowSkeleton />
                            </>
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="border-b border-gray-100 hover:bg-[#f8fafc] cursor-pointer"
                                    onClick={() => window.location.href = `/procurement/purchase-orders/${order.id}`}
                                >
                                    <td className="px-4 py-3 font-semibold text-[#0f172a]">{order.poNumber}</td>
                                    <td className="px-4 py-3 text-[#64748b]">{order.supplier?.name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-[#64748b]">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-[#64748b]">{order.items?.length || 0}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-[#0f172a]">₹{Number(order.total).toLocaleString('en-IN')}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-4 py-3 text-[#64748b]">
                                        {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <FiFilter className="w-12 h-12 text-[#cbd5e1] mb-3" />
                                        <p className="text-[#64748b] font-medium">No purchase orders found</p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {searchQuery ? "Try adjusting your search." : "Create your first purchase order to get started."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
