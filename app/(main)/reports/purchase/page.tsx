"use client";

import { useState, useEffect } from "react";
import { FiPackage, FiTrendingUp, FiCalendar, FiDownload } from "react-icons/fi";
import { MdShowChart } from "react-icons/md";

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
    </div>
);

const TableRowSkeleton = () => (
    <tr className="border-b border-[#e2e8f0] animate-pulse">
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
        <td className="py-4 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-1/2 ml-auto"></div></td>
        <td className="py-4 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div></td>
        <td className="py-4 px-4 text-right"><div className="h-4 bg-gray-200 rounded w-1/2 ml-auto"></div></td>
    </tr>
)

export default function PurchaseReportPage() {
    const [dateRange, setDateRange] = useState("thisMonth");
    const [purchaseData, setPurchaseData] = useState<any[]>([]);
    const [topPurchasedItems, setTopPurchasedItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setPurchaseData([]);
            setTopPurchasedItems([]);
            setIsLoading(false);
        }, 1500)
        return () => clearTimeout(timer);
    }, [dateRange]);

    const totalPurchase = purchaseData.reduce((sum, item) => sum + item.amount, 0);
    const totalOrders = purchaseData.reduce((sum, item) => sum + item.orders, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalPurchase / totalOrders) : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Purchase Report</h1>
                            <p className="text-sm text-[#64748b]">Supplier performance and purchasing analysis</p>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                disabled={isLoading}
                            >
                                <option value="thisMonth">This Month</option>
                                <option value="lastMonth">Last Month</option>
                                <option value="thisQuarter">This Quarter</option>
                                <option value="thisYear">This Year</option>
                            </select>
                            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2" disabled={isLoading}>
                                <FiDownload className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton/>
                            <StatCardSkeleton/>
                            <StatCardSkeleton/>
                        </>
                    ) : (
                        <>
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total Purchase</span>
                                    <FiPackage className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-blue-600">₹{(totalPurchase / 1000).toFixed(0)}K</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total Orders</span>
                                    <MdShowChart className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">{totalOrders}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Avg Order Value</span>
                                    <FiTrendingUp className="w-5 h-5 text-[#0ea5a3]" />
                                </div>
                                <div className="text-3xl font-bold text-[#0ea5a3]">₹{avgOrderValue.toLocaleString()}</div>
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-8">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Supplier-wise Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e2e8f0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Supplier</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Category</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Amount</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Orders</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Avg Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                        <TableRowSkeleton/>
                                    </>
                                ) : purchaseData.length > 0 ? (
                                    purchaseData.map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                            <td className="py-4 px-4 font-medium text-[#0f172a]">{item.supplier}</td>
                                            <td className="py-4 px-4 text-[#64748b]">{item.category}</td>
                                            <td className="py-4 px-4 text-right font-semibold text-blue-600">₹{item.amount.toLocaleString()}</td>
                                            <td className="py-4 px-4 text-right text-[#0f172a]">{item.orders}</td>
                                            <td className="py-4 px-4 text-right text-[#64748b]">₹{item.avgOrderValue.toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">No purchase data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Top Purchased Items</h3>
                    <div className="space-y-3">
                        {isLoading ? (
                            <>
                                <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                                <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                                <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                            </>
                        ) : topPurchasedItems.length > 0 ? (
                            topPurchasedItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg hover:shadow-sm transition-shadow">
                                    <div className="flex-1">
                                        <div className="font-medium text-[#0f172a] mb-1">{item.name}</div>
                                        <div className="text-sm text-[#64748b]">Supplier: {item.supplier}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-[#0f172a]">₹{item.amount.toLocaleString()}</div>
                                        <div className="text-sm text-[#64748b]">Qty: {item.qty}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">No item data available.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
