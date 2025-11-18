import Link from 'next/link';
import { HiOutlinePlus, HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2';

export default function OrdersPage() {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a]">Orders & Purchase</h1>
                    <p className="text-[#6b7280] mt-2">Manage supplier orders and purchase history.</p>
                </div>
                <Link
                    href="/orders/new-po"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                    <HiOutlinePlus className="h-4 w-4" />
                    New Purchase Order
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <HiOutlineDocumentText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Draft POs</div>
                            <div className="text-xl font-semibold text-gray-900">3</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <HiOutlineClock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Pending</div>
                            <div className="text-xl font-semibold text-gray-900">7</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <HiOutlineCheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Received</div>
                            <div className="text-xl font-semibold text-gray-900">24</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <HiOutlineDocumentText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">This Month</div>
                            <div className="text-xl font-semibold text-gray-900">₹2.4L</div>
                        </div>
                    </div>
                </div>
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
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PO-2025-000123
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ABC Pharma Distributors
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Nov 14, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₹45,600
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                        Sent
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-blue-600 hover:text-blue-800">View</button>
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    PO-2025-000122
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    MediCore Supplies
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Nov 13, 2025
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₹32,400
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                        Pending
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button className="text-blue-600 hover:text-blue-800">View</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}