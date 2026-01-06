"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle, HiOutlinePencil } from 'react-icons/hi2';

interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplier: { name: string };
    createdAt: string;
    total: number;
    status: string;
}

const StatCard = ({ icon, label, value, loading, color = 'blue' }: any) => {
    const colors: any = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    }
    const colorClass = colors[color]

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`p-2 ${colorClass.bg} rounded-lg`}>
                    {icon}
                </div>
                <div>
                    <div className="text-sm text-gray-600">{label}</div>
                    {loading ? (
                        <div className="h-6 w-16 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                    ) : (
                        <div className="text-xl font-semibold text-gray-900">{value}</div>
                    )}
                </div>
            </div>
        </div>
    )
}

const TableRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-md w-24"></div></td>
    </tr>
)

const getStatusBadge = (status: string) => {
    const statusConfig: any = {
        DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
        PENDING_APPROVAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
        APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
        SENT: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Sent' },
        PARTIALLY_RECEIVED: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partial' },
        RECEIVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Received' },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

export default function OrdersPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchOrders();
    }, [])

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiBaseUrl}/purchase-orders?limit=50`, {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                const fetchedOrders = Array.isArray(result.data) ? result.data : (result.data?.orders || []);

                // Fetch GRNs for received orders to get actual totals
                const ordersWithGRNTotals = await Promise.all(
                    fetchedOrders.map(async (order: PurchaseOrder) => {
                        if (order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') {
                            try {
                                const grnResponse = await fetch(`${apiBaseUrl}/grn/po/${order.id}`, {
                                    credentials: 'include'
                                });

                                if (grnResponse.ok) {
                                    const grnData = await grnResponse.json();
                                    const grns = grnData.data || [];
                                    const grnTotal = grns.reduce((sum: number, grn: any) => sum + Number(grn.total || 0), 0);
                                    return { ...order, total: grnTotal };
                                }
                            } catch (error) {
                                console.error('Failed to fetch GRN for order:', order.id, error);
                            }
                        }
                        return order;
                    })
                );

                setOrders(ordersWithGRNTotals);

                // Calculate stats
                const draft = ordersWithGRNTotals.filter((o: PurchaseOrder) => o.status === 'DRAFT').length;
                const pending = ordersWithGRNTotals.filter((o: PurchaseOrder) => o.status === 'PENDING_APPROVAL' || o.status === 'SENT').length;
                const received = ordersWithGRNTotals.filter((o: PurchaseOrder) => o.status === 'RECEIVED').length;

                const thisMonth = ordersWithGRNTotals
                    .filter((o: PurchaseOrder) => {
                        const orderDate = new Date(o.createdAt);
                        const now = new Date();
                        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum: number, o: PurchaseOrder) => sum + Number(o.total || 0), 0);

                setStats({
                    draft,
                    pending,
                    received,
                    thisMonth: `₹${thisMonth.toFixed(2)}`
                });
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setStats({ draft: 0, pending: 0, received: 0, thisMonth: '₹0' });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number | string) => `₹${Number(amount || 0).toFixed(2)}`;
    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a]">Orders & Purchase</h1>
                    <p className="text-[#6b7280] mt-2">Manage supplier orders and purchase history.</p>
                </div>
                <Link
                    href="/orders/new-po"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
                >
                    <HiOutlinePlus className="h-4 w-4" />
                    New Purchase Order
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<HiOutlineDocumentText className="h-5 w-5" />} label="Draft POs" value={stats?.draft} loading={isLoading} color="blue" />
                <StatCard icon={<HiOutlineClock className="h-5 w-5" />} label="Pending" value={stats?.pending} loading={isLoading} color="yellow" />
                <StatCard icon={<HiOutlineCheckCircle className="h-5 w-5" />} label="Received" value={stats?.received} loading={isLoading} color="green" />
                <StatCard icon={<HiOutlineDocumentText className="h-5 w-5" />} label="This Month" value={stats?.thisMonth} loading={isLoading} color="purple" />
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Recent Purchase Orders</h2>
                </div>
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
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <>
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                </>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <HiOutlineDocumentText className="h-10 w-10 text-gray-300 mb-2" />
                                            <p className="font-medium">No orders found.</p>
                                            <p className="text-sm">Create a new purchase order to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {order.poNumber || 'Draft'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {order.supplier?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {formatCurrency(order.total)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {order.status === 'DRAFT' ? (
                                                <Link
                                                    href={`/orders/new-po?id=${order.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors"
                                                >
                                                    <HiOutlinePencil className="h-4 w-4" />
                                                    Edit
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    View
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}