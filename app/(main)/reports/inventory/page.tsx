"use client";

import { FiPackage, FiAlertCircle, FiTrendingUp, FiDownload } from "react-icons/fi";

const inventoryMetrics = {
    totalValue: 2850000,
    totalItems: 1245,
    lowStock: 45,
    deadStock: 12,
    turnoverRatio: 8.5
};

const categoryData = [
    { category: "Prescription Drugs", value: 1500000, items: 450, turnover: 9.2 },
    { category: "OTC Medicines", value: 850000, items: 380, turnover: 8.5 },
    { category: "Health Supplements", value: 350000, items: 280, turnover: 6.8 },
    { category: "Medical Devices", value: 150000, items: 135, turnover: 5.2 }
];

export default function InventoryReportPage() {
    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Inventory Report</h1>
                            <p className="text-sm text-[#64748b]">Stock valuation and movement analysis</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                            <FiDownload className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Value</span>
                            <FiPackage className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">₹{(inventoryMetrics.totalValue / 1000).toFixed(0)}K</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Items</span>
                            <FiPackage className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{inventoryMetrics.totalItems}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Low Stock</span>
                            <FiAlertCircle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{inventoryMetrics.lowStock}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Turnover Ratio</span>
                            <FiTrendingUp className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">{inventoryMetrics.turnoverRatio}x</div>
                    </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="font-semibold text-[#0f172a] mb-6">Category-wise Analysis</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#e2e8f0]">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-[#0f172a]">Category</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Value</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Items</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-[#0f172a]">Turnover</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categoryData.map((cat, idx) => (
                                    <tr key={idx} className="border-b border-[#e2e8f0] hover:bg-[#f8fafc]">
                                        <td className="py-4 px-4 font-medium text-[#0f172a]">{cat.category}</td>
                                        <td className="py-4 px-4 text-right font-semibold text-blue-600">₹{cat.value.toLocaleString()}</td>
                                        <td className="py-4 px-4 text-right text-[#0f172a]">{cat.items}</td>
                                        <td className="py-4 px-4 text-right text-green-600">{cat.turnover}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
