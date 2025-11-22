"use client";

import { useState } from "react";
import { FiSearch, FiCheck, FiX, FiDollarSign, FiPackage, FiCalendar, FiAlertTriangle } from "react-icons/fi";
import { MdReceipt } from "react-icons/md";

const mockRefunds = [
    {
        id: "REF001",
        invoiceId: "INV-2025-001234",
        customerName: "Rajesh Kumar",
        customerPhone: "+91 98765 43210",
        originalAmount: 1250,
        refundAmount: 1250,
        items: [
            { name: "Paracetamol 500mg", qty: 2, price: 50, reason: "Expired product" },
            { name: "Cough Syrup 100ml", qty: 1, price: 150, reason: "Wrong product" }
        ],
        refundReason: "Product quality issue",
        requestDate: "2025-01-22",
        status: "pending",
        paymentMethod: "Cash"
    },
    {
        id: "REF002",
        invoiceId: "INV-2025-001198",
        customerName: "Priya Singh",
        customerPhone: "+91 98765 43211",
        originalAmount: 850,
        refundAmount: 425,
        items: [
            { name: "Vitamin D3 60K", qty: 1, price: 425, reason: "Duplicate purchase" }
        ],
        refundReason: "Customer changed mind",
        requestDate: "2025-01-21",
        status: "approved",
        paymentMethod: "UPI"
    },
    {
        id: "REF003",
        invoiceId: "INV-2025-001156",
        customerName: "Amit Verma",
        customerPhone: "+91 98765 43212",
        originalAmount: 2100,
        refundAmount: 2100,
        items: [
            { name: "Insulin Glargine 100IU", qty: 1, price: 2100, reason: "Wrong strength" }
        ],
        refundReason: "Prescription error",
        requestDate: "2025-01-20",
        status: "completed",
        paymentMethod: "Card"
    }
];

export default function POSRefundsPage() {
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRefund, setSelectedRefund] = useState<any>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
            case "approved": return "bg-blue-100 text-blue-700 border-blue-200";
            case "completed": return "bg-green-100 text-green-700 border-green-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const filteredRefunds = mockRefunds.filter(refund => {
        const matchesFilter = filter === "all" || refund.status === filter;
        const matchesSearch = refund.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refund.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        pending: mockRefunds.filter(r => r.status === "pending").length,
        approved: mockRefunds.filter(r => r.status === "approved").length,
        completed: mockRefunds.filter(r => r.status === "completed").length,
        totalAmount: mockRefunds.reduce((sum, r) => sum + r.refundAmount, 0)
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Refund Management</h1>
                    <p className="text-sm text-[#64748b]">Process customer refunds and returns</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Pending</span>
                            <FiAlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Approved</span>
                            <FiCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{stats.approved}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Completed</span>
                            <FiCheck className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Amount</span>
                            <FiDollarSign className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">₹{stats.totalAmount.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                                <input
                                    type="text"
                                    placeholder="Search by customer name or invoice ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter("pending")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "pending" ? "bg-amber-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setFilter("approved")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "approved" ? "bg-blue-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Approved
                            </button>
                            <button
                                onClick={() => setFilter("completed")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "completed" ? "bg-green-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Refunds List */}
                <div className="space-y-4">
                    {filteredRefunds.map((refund) => (
                        <div key={refund.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-[#0f172a]">{refund.customerName}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}>
                                            {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                        <span className="flex items-center gap-1">
                                            <MdReceipt className="w-4 h-4" />
                                            {refund.invoiceId}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiCalendar className="w-4 h-4" />
                                            {new Date(refund.requestDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {refund.status === "pending" && (
                                        <>
                                            <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                                                <FiCheck className="w-4 h-4" />
                                                Approve
                                            </button>
                                            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
                                                <FiX className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {refund.status === "approved" && (
                                        <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2">
                                            <FiDollarSign className="w-4 h-4" />
                                            Process Refund
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f8fafc] rounded-lg mb-4">
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Original Amount</div>
                                    <div className="font-medium text-[#0f172a]">₹{refund.originalAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Refund Amount</div>
                                    <div className="font-bold text-red-600">₹{refund.refundAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Payment Method</div>
                                    <div className="font-medium text-[#0f172a]">{refund.paymentMethod}</div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-t border-[#e2e8f0] pt-4">
                                <h4 className="font-medium text-[#0f172a] mb-3 flex items-center gap-2">
                                    <FiPackage className="w-4 h-4" />
                                    Refund Items
                                </h4>
                                <div className="space-y-2">
                                    {refund.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-[#e2e8f0] rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-[#0f172a]">{item.name}</div>
                                                <div className="text-sm text-[#64748b]">Reason: {item.reason}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-[#0f172a]">Qty: {item.qty}</div>
                                                <div className="text-sm text-[#64748b]">₹{item.price}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                                <div className="text-sm text-[#64748b]">
                                    Refund Reason: <span className="font-medium text-[#0f172a]">{refund.refundReason}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredRefunds.length === 0 && (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <MdReceipt className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Refunds Found</h3>
                        <p className="text-[#64748b]">Try adjusting your filters or search query</p>
                    </div>
                )}
            </div>
        </div>
    );
}
