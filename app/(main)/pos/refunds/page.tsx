"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiCheck, FiX, FiDollarSign, FiPackage, FiCalendar, FiAlertTriangle } from "react-icons/fi";
import { MdReceipt } from "react-icons/md";
import { salesApi } from "@/lib/api/sales";

const RefundCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
        <div className="h-16 bg-gray-100 rounded-lg mb-4"></div>
        <div className="border-t border-[#e2e8f0] pt-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="space-y-2">
                <div className="h-12 bg-gray-100 rounded-lg"></div>
            </div>
        </div>
    </div>
)

export default function POSRefundsPage() {
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [refunds, setRefunds] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRefunds();
    }, [filter]);

    const fetchRefunds = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const params: any = {};
            if (filter !== "all") {
                params.status = filter.toUpperCase();
            }
            const response = await salesApi.getRefunds(params);
            setRefunds(response.refunds || []);
        } catch (err: any) {
            console.error('Error fetching refunds:', err);
            setError(err.message || 'Failed to load refunds');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (refundId: string) => {
        if (!confirm('Are you sure you want to approve this refund?')) return;

        try {
            await salesApi.approveRefund(refundId);
            fetchRefunds(); // Refresh list
        } catch (err: any) {
            alert('Failed to approve refund: ' + err.message);
        }
    };

    const handleReject = async (refundId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await salesApi.rejectRefund(refundId, reason);
            fetchRefunds(); // Refresh list
        } catch (err: any) {
            alert('Failed to reject refund: ' + err.message);
        }
    };

    const handleProcess = async (refundId: string) => {
        if (!confirm('Process this refund? This will restore inventory and cannot be undone.')) return;

        try {
            await salesApi.processRefund(refundId);
            fetchRefunds(); // Refresh list
        } catch (err: any) {
            alert('Failed to process refund: ' + err.message);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
            case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
            case "approved": return "bg-blue-100 text-blue-700 border-blue-200";
            case "completed": return "bg-green-100 text-green-700 border-green-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusLabel = (status: string) => {
        return status.charAt(0) + status.slice(1).toLowerCase();
    };

    const filteredRefunds = refunds.filter(refund => {
        const matchesSearch =
            refund.refundNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refund.originalSale?.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const stats = {
        pending: refunds.filter(r => r.status === "PENDING").length,
        approved: refunds.filter(r => r.status === "APPROVED").length,
        completed: refunds.filter(r => r.status === "COMPLETED").length,
        totalAmount: refunds.reduce((sum, r) => sum + Number(r.refundAmount), 0)
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Refund Management</h1>
                    <p className="text-sm text-[#64748b]">Manage and process customer refunds</p>
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
                        {isLoading ? <div className="h-8 w-1/4 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>}
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Approved</span>
                            <FiCheck className="w-5 h-5 text-blue-500" />
                        </div>
                        {isLoading ? <div className="h-8 w-1/4 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-blue-600">{stats.approved}</div>}
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Completed</span>
                            <FiPackage className="w-5 h-5 text-green-500" />
                        </div>
                        {isLoading ? <div className="h-8 w-1/4 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-green-600">{stats.completed}</div>}
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Amount</span>
                            <FiDollarSign className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        {isLoading ? <div className="h-8 w-1/2 bg-gray-200 rounded-md animate-pulse"></div> : <div className="text-3xl font-bold text-[#0ea5a3]">₹{stats.totalAmount.toLocaleString()}</div>}
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filter Tabs */}
                        <div className="flex gap-2 flex-wrap">
                            {["all", "pending", "approved", "completed", "rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                                        ? "bg-[#0ea5a3] text-white"
                                        : "bg-[#f8fafc] text-[#64748b] hover:bg-[#e2e8f0]"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by refund number or invoice..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                        <button onClick={fetchRefunds} className="mt-2 text-red-600 underline">Retry</button>
                    </div>
                )}

                {/* Refunds List */}
                {isLoading ? (
                    <div className="space-y-4">
                        <RefundCardSkeleton />
                        <RefundCardSkeleton />
                    </div>
                ) : filteredRefunds.length > 0 ? (
                    <div className="space-y-4">
                        {filteredRefunds.map((refund) => (
                            <div key={refund.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">
                                                {refund.refundNumber}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}>
                                                {getStatusLabel(refund.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                            <span className="flex items-center gap-1">
                                                <MdReceipt className="w-4 h-4" />
                                                Invoice: {refund.originalSale?.invoiceNumber || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiCalendar className="w-4 h-4" />
                                                {new Date(refund.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FiDollarSign className="w-4 h-4" />
                                                ₹{Number(refund.refundAmount).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {refund.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(refund.id)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(refund.id)}
                                                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {refund.status === "APPROVED" && (
                                            <button
                                                onClick={() => handleProcess(refund.id)}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                                            >
                                                <FiPackage className="w-4 h-4" />
                                                Process Refund
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Refund Reason */}
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="text-sm font-medium text-amber-900 mb-1">Refund Reason</div>
                                    <div className="text-sm text-amber-700">{refund.refundReason}</div>
                                </div>

                                {/* Items */}
                                <div className="border-t border-[#e2e8f0] pt-4">
                                    <h4 className="font-medium text-[#0f172a] mb-3 text-sm">Refund Items ({refund.items?.length || 0})</h4>
                                    <div className="space-y-2">
                                        {refund.items?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                                                <div className="flex-1">
                                                    <div className="font-medium text-[#0f172a]">Item {idx + 1}</div>
                                                    <div className="text-sm text-[#64748b]">{item.reason}</div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm">
                                                    <div className="text-[#64748b]">Qty: <span className="font-medium text-[#0f172a]">{item.quantity}</span></div>
                                                    <div className="font-medium text-[#0f172a]">₹{Number(item.refundAmount).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Timeline */}
                                {(refund.approvedAt || refund.completedAt) && (
                                    <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                                        <div className="text-xs text-[#64748b] space-y-1">
                                            {refund.approvedAt && (
                                                <div>Approved: {new Date(refund.approvedAt).toLocaleString()}</div>
                                            )}
                                            {refund.completedAt && (
                                                <div>Completed: {new Date(refund.completedAt).toLocaleString()}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <MdReceipt className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Refunds Found</h3>
                        <p className="text-[#64748b]">
                            {filter !== "all"
                                ? `No ${filter} refunds at the moment`
                                : "No refund requests have been made yet"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
