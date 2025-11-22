"use client";

import { useState } from "react";
import { FiSearch, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from "react-icons/fi";

const mockClaims: any[] = [];

export default function CustomerClaimsPage() {
    const [selectedId, setSelectedId] = useState("CLM001");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filteredClaims = mockClaims.filter(claim => {
        const matchesSearch = claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.rxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || claim.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const selectedClaim = mockClaims.find(c => c.id === selectedId);

    const stats = {
        total: mockClaims.length,
        pending: mockClaims.filter(c => c.status === "pending").length,
        approved: mockClaims.filter(c => c.status === "approved").length,
        rejected: mockClaims.filter(c => c.status === "rejected").length,
        totalRefunded: mockClaims.filter(c => c.status === "approved").reduce((sum, c) => sum + c.refundAmount, 0)
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Customer Claims</h1>
                    <p className="text-sm text-[#64748b]">Manage customer returns, refunds, and insurance claim reversals</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto grid grid-cols-5 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Total Claims</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Pending Review</div>
                            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Approved</div>
                            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FiXCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Rejected</div>
                            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Total Refunded</div>
                            <div className="text-2xl font-bold text-emerald-600">₹{stats.totalRefunded.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Claims List (40%) */}
                <div className="w-2/5 border-r border-[#e2e8f0] bg-white flex flex-col">
                    <div className="p-4 border-b border-[#e2e8f0]">
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by patient, Rx ID, or invoice..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "pending", "approved", "rejected"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredClaims.map((claim) => (
                            <div
                                key={claim.id}
                                onClick={() => setSelectedId(claim.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedId === claim.id ? "border-[#0ea5a3] bg-emerald-50" :
                                        claim.status === "pending" && claim.priority === "urgent" ? "border-red-200 bg-red-50 hover:border-red-300" :
                                            claim.status === "pending" ? "border-amber-200 bg-amber-50 hover:border-amber-300" :
                                                claim.status === "approved" ? "border-green-200 bg-green-50 hover:border-green-300" :
                                                    "border-red-200 bg-red-50 hover:border-red-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-[#0f172a]">{claim.patientName}</h3>
                                        <p className="text-sm text-[#64748b]">{claim.rxId} • {claim.invoiceId}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${claim.status === "pending" ? "bg-amber-100 text-amber-700" :
                                            claim.status === "approved" ? "bg-green-100 text-green-700" :
                                                "bg-red-100 text-red-700"
                                        }`}>
                                        {claim.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Reason:</span>
                                        <span className="font-medium text-[#0f172a]">{claim.returnReason}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Amount:</span>
                                        <span className="font-medium text-[#0f172a]">₹{claim.originalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Date:</span>
                                        <span className="font-medium text-[#0f172a]">{claim.claimDate}</span>
                                    </div>
                                </div>
                                {claim.insuranceClaimId && (
                                    <div className="mt-2 flex items-center gap-1 text-xs">
                                        <span className={`px-2 py-0.5 rounded ${claim.reversalStatus === "Completed" ? "bg-green-100 text-green-700" :
                                                claim.reversalStatus === "Pending" ? "bg-blue-100 text-blue-700" :
                                                    "bg-gray-100 text-gray-600"
                                            }`}>
                                            Insurance: {claim.reversalStatus}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Claim Detail (60%) */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedClaim ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Patient & Prescription Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient & Prescription Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Patient Name</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.patientName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Prescription ID</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.rxId}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Invoice ID</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.invoiceId}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Claim Date</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.claimDate}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Return Request Details */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Return Request Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-[#64748b] mb-1">Reason for Return</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.returnReason}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b] mb-1">Medication Condition</div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedClaim.medicationCondition === "Unopened" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {selectedClaim.medicationCondition}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Check */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-blue-900 mb-4">Eligibility Check</h2>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-blue-900">Within return window (30 days)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-blue-900">Unopened/tamper-evident seal intact</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-blue-900">Not a controlled substance</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FiCheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-blue-900">Pharmacy error documented</span>
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Claim Reversal */}
                            {selectedClaim.insuranceClaimId && (
                                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                    <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Insurance Claim Reversal</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-[#64748b]">Claim ID</div>
                                            <div className="font-medium text-[#0f172a]">{selectedClaim.insuranceClaimId}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#64748b]">Reversal Status</div>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedClaim.reversalStatus === "Completed" ? "bg-green-100 text-green-700" :
                                                    selectedClaim.reversalStatus === "Pending" ? "bg-blue-100 text-blue-700" :
                                                        "bg-gray-100 text-gray-600"
                                                }`}>
                                                {selectedClaim.reversalStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Refund Calculation */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Refund Calculation</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748b]">Original Amount Paid:</span>
                                        <span className="font-medium text-[#0f172a]">₹{selectedClaim.originalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748b]">Restocking Fee:</span>
                                        <span className="font-medium text-[#0f172a]">₹{selectedClaim.restockingFee}</span>
                                    </div>
                                    <div className="border-t border-[#e2e8f0] pt-3 flex justify-between">
                                        <span className="font-semibold text-[#0f172a]">Refund Amount:</span>
                                        <span className="text-2xl font-bold text-emerald-600">₹{selectedClaim.refundAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedClaim.status === "pending" && (
                                <div className="flex gap-3">
                                    <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                        <FiCheckCircle className="w-5 h-5" />
                                        Approve Return
                                    </button>
                                    <button className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                                        <FiXCircle className="w-5 h-5" />
                                        Reject Return
                                    </button>
                                    <button className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                        Request More Info
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#64748b]">
                            Select a claim to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
