"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2';

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

export default function OrdersPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setOrders([]);
            setStats({ draft: 0, pending: 0, received: 0, thisMonth: '₹0' });
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [])

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a]">Orders & Purchase</h1>
                    <p className="text-[#6b7280] mt-2">Manage supplier orders and purchase history.</p>
                </div>
                <Link
                    href="/orders/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
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
                                <TableRowSkeleton/>
                                <TableRowSkeleton/>
                                <TableRowSkeleton/>
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
                                // Map orders here when data is available
                                null
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}