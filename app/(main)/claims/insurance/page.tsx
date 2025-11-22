"use client";

import { useState } from "react";
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiFileText, FiUpload, FiAlertCircle } from "react-icons/fi";

const mockClaims = [
    { id: "INS001", patientName: "Rajesh Kumar", policyNumber: "POL-2024-1001", insuranceCompany: "Star Health Insurance", claimDate: "2024-11-18", prescriptionId: "RX-2024-001", claimType: "Reimbursement", totalAmount: 2500, approvedAmount: 2500, rejectedAmount: 0, status: "approved", paymentStatus: "received", daysInAdjudication: 5, priority: "normal" },
    { id: "INS002", patientName: "Priya Sharma", policyNumber: "POL-2024-1002", insuranceCompany: "HDFC Ergo Health", claimDate: "2024-11-20", prescriptionId: "RX-2024-002", claimType: "Cashless", totalAmount: 3200, approvedAmount: 2800, rejectedAmount: 400, status: "partial", paymentStatus: "pending", daysInAdjudication: 2, priority: "normal" },
    { id: "INS003", patientName: "Amit Verma", policyNumber: "POL-2024-1003", insuranceCompany: "ICICI Lombard", claimDate: "2024-11-19", prescriptionId: "RX-2024-003", claimType: "Reimbursement", totalAmount: 1800, approvedAmount: 0, rejectedAmount: 1800, status: "rejected", paymentStatus: "n/a", daysInAdjudication: 3, priority: "normal", rejectionReason: "Pre-authorization not obtained" },
    { id: "INS004", patientName: "Sneha Reddy", policyNumber: "POL-2024-1004", insuranceCompany: "Care Health Insurance", claimDate: "2024-11-21", prescriptionId: "RX-2024-004", claimType: "Reimbursement", totalAmount: 4500, approvedAmount: 0, rejectedAmount: 0, status: "pending", paymentStatus: "pending", daysInAdjudication: 1, priority: "urgent" },
    { id: "INS005", patientName: "Vikram Singh", policyNumber: "POL-2024-1005", insuranceCompany: "Max Bupa", claimDate: "2024-11-17", prescriptionId: "RX-2024-005", claimType: "Cashless", totalAmount: 2200, approvedAmount: 0, rejectedAmount: 2200, status: "appealed", paymentStatus: "pending", daysInAdjudication: 5, priority: "normal", rejectionReason: "Outside coverage window" }
];

export default function InsuranceClaimsPage() {
    const [selectedId, setSelectedId] = useState("INS001");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filteredClaims = mockClaims.filter(claim => {
        const matchesSearch = claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.insuranceCompany.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || claim.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const selectedClaim = mockClaims.find(c => c.id === selectedId);

    const stats = {
        pending: mockClaims.filter(c => c.status === "pending").length,
        approved: mockClaims.filter(c => c.status === "approved").length,
        rejected: mockClaims.filter(c => c.status === "rejected").length,
        totalReimbursed: mockClaims.filter(c => c.status === "approved").reduce((sum, c) => sum + c.approvedAmount, 0),
        avgAdjudication: 5
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Insurance Claims</h1>
                    <p className="text-sm text-[#64748b]">Submit, track, and manage insurance reimbursement claims</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto grid grid-cols-5 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Pending</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
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
                            <div className="text-sm text-[#64748b]">Reimbursed</div>
                            <div className="text-2xl font-bold text-emerald-600">₹{stats.totalReimbursed.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FiFileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Avg Time</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.avgAdjudication} days</div>
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
                                placeholder="Search by patient, policy, or insurer..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {["all", "pending", "approved", "rejected", "partial", "appealed"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
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
                                        claim.status === "pending" ? "border-blue-200 bg-blue-50 hover:border-blue-300" :
                                            claim.status === "approved" ? "border-green-200 bg-green-50 hover:border-green-300" :
                                                claim.status === "rejected" ? "border-red-200 bg-red-50 hover:border-red-300" :
                                                    claim.status === "partial" ? "border-purple-200 bg-purple-50 hover:border-purple-300" :
                                                        "border-orange-200 bg-orange-50 hover:border-orange-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-[#0f172a]">{claim.patientName}</h3>
                                        <p className="text-sm text-[#64748b]">{claim.policyNumber}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${claim.status === "pending" ? "bg-blue-100 text-blue-700" :
                                            claim.status === "approved" ? "bg-green-100 text-green-700" :
                                                claim.status === "rejected" ? "bg-red-100 text-red-700" :
                                                    claim.status === "partial" ? "bg-purple-100 text-purple-700" :
                                                        "bg-orange-100 text-orange-700"
                                        }`}>
                                        {claim.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="font-medium text-[#0f172a]">{claim.insuranceCompany}</div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Type:</span>
                                        <span className="font-medium text-[#0f172a]">{claim.claimType}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Amount:</span>
                                        <span className="font-medium text-[#0f172a]">₹{claim.totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Days:</span>
                                        <span className="font-medium text-[#0f172a]">{claim.daysInAdjudication} days</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Claim Detail (60%) */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedClaim ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Patient & Policy Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient & Policy Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Patient Name</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.patientName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Policy Number</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.policyNumber}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Insurance Company</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.insuranceCompany}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Claim Type</div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedClaim.claimType === "Cashless" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {selectedClaim.claimType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Details */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescription Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Prescription ID</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.prescriptionId}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Claim Date</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.claimDate}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Days in Adjudication</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.daysInAdjudication} days</div>
                                    </div>
                                </div>
                            </div>

                            {/* Required Documentation */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Required Documentation</h2>
                                <div className="space-y-3">
                                    {[
                                        { label: "Original Pharmacy Bills", uploaded: true },
                                        { label: "Payment Receipts", uploaded: true },
                                        { label: "Doctor's Prescription", uploaded: true },
                                        { label: "Discharge Summary", uploaded: false },
                                        { label: "Diagnostic Reports", uploaded: false },
                                        { label: "Claim Form", uploaded: true },
                                        { label: "Policy Copy", uploaded: true },
                                        { label: "ID Proof", uploaded: true }
                                    ].map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                                            <div className="flex items-center gap-2">
                                                {doc.uploaded ? (
                                                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <FiAlertCircle className="w-5 h-5 text-amber-600" />
                                                )}
                                                <span className="text-sm text-[#0f172a]">{doc.label}</span>
                                            </div>
                                            {!doc.uploaded && (
                                                <button className="px-3 py-1 text-xs bg-[#0ea5a3] text-white rounded-lg hover:bg-[#0d9391] transition-colors flex items-center gap-1">
                                                    <FiUpload className="w-3 h-3" />
                                                    Upload
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Claim Decision */}
                            <div className={`border-2 rounded-xl p-6 ${selectedClaim.status === "approved" ? "bg-green-50 border-green-200" :
                                    selectedClaim.status === "rejected" ? "bg-red-50 border-red-200" :
                                        selectedClaim.status === "partial" ? "bg-purple-50 border-purple-200" :
                                            "bg-blue-50 border-blue-200"
                                }`}>
                                <h2 className={`text-lg font-semibold mb-4 ${selectedClaim.status === "approved" ? "text-green-900" :
                                        selectedClaim.status === "rejected" ? "text-red-900" :
                                            selectedClaim.status === "partial" ? "text-purple-900" :
                                                "text-blue-900"
                                    }`}>
                                    Claim Decision
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className={selectedClaim.status === "approved" ? "text-green-700" : selectedClaim.status === "rejected" ? "text-red-700" : selectedClaim.status === "partial" ? "text-purple-700" : "text-blue-700"}>
                                            Total Billed:
                                        </span>
                                        <span className="font-semibold text-[#0f172a]">₹{selectedClaim.totalAmount.toLocaleString()}</span>
                                    </div>
                                    {selectedClaim.approvedAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-700">Approved Amount:</span>
                                            <span className="font-semibold text-green-700">₹{selectedClaim.approvedAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {selectedClaim.rejectedAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-red-700">Rejected Amount:</span>
                                            <span className="font-semibold text-red-700">₹{selectedClaim.rejectedAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {selectedClaim.rejectionReason && (
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                            <div className="text-xs text-[#64748b] mb-1">Rejection Reason</div>
                                            <div className="text-sm font-medium text-red-700">{selectedClaim.rejectionReason}</div>
                                        </div>
                                    )}
                                    {selectedClaim.status === "approved" && (
                                        <div className="mt-3 p-3 bg-white rounded-lg">
                                            <div className="text-xs text-[#64748b] mb-1">Payment Status</div>
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedClaim.paymentStatus === "received" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                }`}>
                                                {selectedClaim.paymentStatus === "received" ? "Payment Received" : "Payment Pending"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {selectedClaim.status === "pending" && (
                                    <>
                                        <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                            <FiFileText className="w-5 h-5" />
                                            Submit Claim
                                        </button>
                                        <button className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                            Check Status
                                        </button>
                                    </>
                                )}
                                {selectedClaim.status === "rejected" && (
                                    <button className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                                        <FiAlertCircle className="w-5 h-5" />
                                        File Appeal
                                    </button>
                                )}
                                {selectedClaim.status === "approved" && selectedClaim.paymentStatus !== "received" && (
                                    <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                        <FiCheckCircle className="w-5 h-5" />
                                        Mark Payment Received
                                    </button>
                                )}
                                <button className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                    Print Summary
                                </button>
                            </div>
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
