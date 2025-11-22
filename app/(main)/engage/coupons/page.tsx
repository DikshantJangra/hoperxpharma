"use client";

import { useState } from "react";
import { FiPercent, FiDollarSign, FiCopy, FiEdit, FiTrash2, FiPlus, FiDownload } from "react-icons/fi";
import { MdLocalOffer } from "react-icons/md";

const mockCoupons = [
    { id: "1", code: "SAVE20", name: "20% Off Sale", type: "Percentage", value: 20, used: 245, limit: 500, validFrom: "2024-11-01", validTo: "2024-12-31", status: "Active", totalDiscount: 12450 },
    { id: "2", code: "WELCOME100", name: "Welcome Offer", type: "Fixed", value: 100, used: 89, limit: 200, validFrom: "2024-11-01", validTo: "2024-12-31", status: "Active", totalDiscount: 8900 },
    { id: "3", code: "REFILL50", name: "Refill Discount", type: "Fixed", value: 50, used: 156, limit: 300, validFrom: "2024-10-01", validTo: "2024-11-30", status: "Expired", totalDiscount: 7800 },
    { id: "4", code: "BOGO", name: "Buy One Get One", type: "BOGO", value: 0, used: 78, limit: 100, validFrom: "2024-11-15", validTo: "2024-11-30", status: "Active", totalDiscount: 15600 }
];

export default function CouponsPage() {
    const [filter, setFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCoupons = mockCoupons.filter(coupon => {
        const matchesFilter = filter === "All" || coupon.status === filter;
        const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const totalCoupons = mockCoupons.length;
    const activeCoupons = mockCoupons.filter(c => c.status === "Active").length;
    const totalRedemptions = mockCoupons.reduce((sum, c) => sum + c.used, 0);
    const totalDiscount = mockCoupons.reduce((sum, c) => sum + c.totalDiscount, 0);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Coupon Management</h1>
                            <p className="text-sm text-[#64748b]">Create and track promotional coupons</p>
                        </div>
                        <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                            <FiPlus className="w-4 h-4" />
                            Create Coupon
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Coupons</span>
                            <MdLocalOffer className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{totalCoupons}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Active</span>
                            <FiPercent className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{activeCoupons}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Redemptions</span>
                            <FiDollarSign className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">{totalRedemptions}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Discount</span>
                            <FiDownload className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">₹{(totalDiscount / 1000).toFixed(0)}K</div>
                    </div>
                </div>

                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex gap-2 mb-6">
                        {["All", "Active", "Expired", "Paused"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {filteredCoupons.map((coupon) => (
                            <div key={coupon.id} className={`p-6 border-2 rounded-xl hover:shadow-md transition-shadow ${coupon.status === "Active" ? "border-green-200 bg-green-50" :
                                    coupon.status === "Expired" ? "border-gray-200 bg-gray-50" :
                                        "border-blue-200 bg-blue-50"
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg ${coupon.status === "Active" ? "bg-green-600 text-white" :
                                                    coupon.status === "Expired" ? "bg-gray-400 text-white" :
                                                        "bg-blue-600 text-white"
                                                }`}>
                                                {coupon.code}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[#0f172a]">{coupon.name}</h3>
                                                <p className="text-sm text-[#64748b]">{coupon.type} {coupon.type === "Percentage" ? `${coupon.value}%` : coupon.type === "Fixed" ? `₹${coupon.value}` : ""} Off</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-[#64748b]">Usage</div>
                                                <div className="font-medium text-[#0f172a]">{coupon.used}/{coupon.limit}</div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                                    <div className="bg-[#0ea5a3] h-2 rounded-full" style={{ width: `${(coupon.used / coupon.limit) * 100}%` }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Valid Till</div>
                                                <div className="font-medium text-[#0f172a]">{new Date(coupon.validTo).toLocaleDateString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Total Discount</div>
                                                <div className="font-medium text-green-600">₹{coupon.totalDiscount.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[#64748b]">Status</div>
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${coupon.status === "Active" ? "bg-green-100 text-green-700" :
                                                        coupon.status === "Expired" ? "bg-gray-100 text-gray-700" :
                                                            "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {coupon.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-white transition-colors">
                                            <FiCopy className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 border border-[#cbd5e1] text-[#475569] rounded-lg hover:bg-white transition-colors">
                                            <FiEdit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-white transition-colors">
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
