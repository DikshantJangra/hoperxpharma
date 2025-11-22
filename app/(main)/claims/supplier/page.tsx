"use client";

import { useState } from "react";
import { FiSearch, FiPackage, FiCheckCircle, FiClock, FiDollarSign, FiAlertCircle, FiUpload } from "react-icons/fi";

const mockClaims = [
    { id: "SUP001", supplierName: "MedSupply Co.", poNumber: "PO-2024-101", claimDate: "2024-11-20", issueType: "Damaged in Transit", productName: "Atorvastatin 10mg", ndc: "00093-0058-01", lotNumber: "LOT12345", expiryDate: "2025-12-31", quantity: 50, unitCost: 10, totalAmount: 500, rmaNumber: "RMA-2024-501", rmaIssueDate: "2024-11-21", creditNoteNumber: null, creditAmount: 0, status: "rma-issued", daysOpen: 2 },
    { id: "SUP002", supplierName: "PharmaDist Ltd.", poNumber: "PO-2024-102", claimDate: "2024-11-19", issueType: "Expired on Arrival", productName: "Metformin 500mg", ndc: "00093-0059-02", lotNumber: "LOT12346", expiryDate: "2024-11-15", quantity: 100, unitCost: 5, totalAmount: 500, rmaNumber: null, rmaIssueDate: null, creditNoteNumber: null, creditAmount: 0, status: "pending", daysOpen: 3 },
    { id: "SUP003", supplierName: "HealthCare Supplies", poNumber: "PO-2024-103", claimDate: "2024-11-15", issueType: "Wrong Item Shipped", productName: "Lisinopril 5mg (Received 10mg)", ndc: "00093-0060-03", lotNumber: "LOT12347", expiryDate: "2026-06-30", quantity: 30, unitCost: 15, totalAmount: 450, rmaNumber: "RMA-2024-502", rmaIssueDate: "2024-11-16", creditNoteNumber: "CN-2024-301", creditAmount: 450, status: "credit-received", daysOpen: 7 },
    { id: "SUP004", supplierName: "MedSupply Co.", poNumber: "PO-2024-104", claimDate: "2024-11-21", issueType: "Short Shipment", productName: "Warfarin 5mg", ndc: "00093-0061-04", lotNumber: "LOT12348", expiryDate: "2025-09-30", quantity: 20, unitCost: 12, totalAmount: 240, rmaNumber: "RMA-2024-503", rmaIssueDate: "2024-11-22", creditNoteNumber: null, creditAmount: 0, status: "returned", daysOpen: 1 }
];

export default function SupplierClaimsPage() {
    const [selectedId, setSelectedId] = useState("SUP001");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filteredClaims = mockClaims.filter(claim => {
        const matchesSearch = claim.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.ndc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || claim.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const selectedClaim = mockClaims.find(c => c.id === selectedId);

    const stats = {
        active: mockClaims.filter(c => c.status !== "credit-received").length,
        pendingRMA: mockClaims.filter(c => c.status === "pending").length,
        creditReceived: mockClaims.filter(c => c.status === "credit-received").reduce((sum, c) => sum + c.creditAmount, 0),
        avgResolution: 8
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Supplier Claims</h1>
                    <p className="text-sm text-[#64748b]">Manage damaged goods claims, RMA process, and credit note tracking</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Active Claims</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Pending RMA</div>
                            <div className="text-2xl font-bold text-amber-600">{stats.pendingRMA}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FiDollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Credit Received</div>
                            <div className="text-2xl font-bold text-green-600">₹{stats.creditReceived.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FiCheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Avg Resolution</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.avgResolution} days</div>
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
                                placeholder="Search by supplier, PO, or NDC..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                            {["all", "pending", "rma-issued", "returned", "credit-received"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                        }`}
                                >
                                    {status === "all" ? "All" : status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
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
                                        claim.daysOpen <= 2 && claim.status === "pending" ? "border-red-200 bg-red-50 hover:border-red-300" :
                                            claim.status === "pending" ? "border-amber-200 bg-amber-50 hover:border-amber-300" :
                                                claim.status === "rma-issued" ? "border-blue-200 bg-blue-50 hover:border-blue-300" :
                                                    claim.status === "credit-received" ? "border-green-200 bg-green-50 hover:border-green-300" :
                                                        "border-purple-200 bg-purple-50 hover:border-purple-300"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-[#0f172a]">{claim.supplierName}</h3>
                                        <p className="text-sm text-[#64748b]">{claim.poNumber}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${claim.status === "pending" ? "bg-amber-100 text-amber-700" :
                                            claim.status === "rma-issued" ? "bg-blue-100 text-blue-700" :
                                                claim.status === "returned" ? "bg-purple-100 text-purple-700" :
                                                    "bg-green-100 text-green-700"
                                        }`}>
                                        {claim.status.toUpperCase().replace("-", " ")}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="font-medium text-[#0f172a]">{claim.productName}</div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Issue:</span>
                                        <span className="font-medium text-[#0f172a]">{claim.issueType}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Amount:</span>
                                        <span className="font-medium text-[#0f172a]">₹{claim.totalAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-[#64748b]">
                                        <span>Days Open:</span>
                                        <span className={`font-medium ${claim.daysOpen <= 2 ? "text-red-600" : "text-[#0f172a]"}`}>
                                            {claim.daysOpen} days
                                        </span>
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
                            {/* PO Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Purchase Order Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">PO Number</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.poNumber}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Supplier</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.supplierName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Claim Date</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.claimDate}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Days Open</div>
                                        <div className={`font-medium ${selectedClaim.daysOpen <= 2 ? "text-red-600" : "text-[#0f172a]"}`}>
                                            {selectedClaim.daysOpen} days
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Damaged Goods Details */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Damaged Goods Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-[#64748b] mb-1">Product Name</div>
                                        <div className="font-medium text-[#0f172a]">{selectedClaim.productName}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-[#64748b]">NDC</div>
                                            <div className="font-mono text-sm text-[#0f172a]">{selectedClaim.ndc}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#64748b]">Lot Number</div>
                                            <div className="font-mono text-sm text-[#0f172a]">{selectedClaim.lotNumber}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#64748b]">Expiry Date</div>
                                            <div className="font-medium text-[#0f172a]">{selectedClaim.expiryDate}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-[#64748b]">Quantity</div>
                                            <div className="font-medium text-[#0f172a]">{selectedClaim.quantity} units</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#64748b]">Unit Cost</div>
                                            <div className="font-medium text-[#0f172a]">₹{selectedClaim.unitCost}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-[#64748b]">Total Amount</div>
                                            <div className="font-semibold text-purple-600">₹{selectedClaim.totalAmount}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b] mb-1">Issue Type</div>
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                            {selectedClaim.issueType}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Documentation */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Documentation</h2>
                                <div className="space-y-3">
                                    <button className="w-full p-4 border-2 border-dashed border-[#cbd5e1] rounded-lg hover:border-[#0ea5a3] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-[#64748b] hover:text-[#0ea5a3]">
                                        <FiUpload className="w-5 h-5" />
                                        <span className="font-medium">Upload Photos of Damage</span>
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-[#f8fafc] rounded-lg">
                                            <div className="text-xs text-[#64748b] mb-1">Freight Bill</div>
                                            <div className="text-sm font-medium text-[#0f172a]">Not uploaded</div>
                                        </div>
                                        <div className="p-3 bg-[#f8fafc] rounded-lg">
                                            <div className="text-xs text-[#64748b] mb-1">Receiving Report</div>
                                            <div className="text-sm font-medium text-[#0f172a]">Not uploaded</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RMA Process */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-blue-900 mb-4">RMA Process</h2>
                                {selectedClaim.rmaNumber ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm text-blue-700">RMA Number</div>
                                                <div className="font-semibold text-blue-900">{selectedClaim.rmaNumber}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-blue-700">Issue Date</div>
                                                <div className="font-medium text-blue-900">{selectedClaim.rmaIssueDate}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FiCheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-sm text-blue-900">RMA issued - Goods can be returned</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-blue-800">
                                        <FiAlertCircle className="w-5 h-5 inline mr-2" />
                                        Awaiting RMA from supplier
                                    </div>
                                )}
                            </div>

                            {/* Credit Note */}
                            {selectedClaim.creditNoteNumber ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                    <h2 className="text-lg font-semibold text-green-900 mb-4">Credit Note</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-green-700">Credit Note Number</div>
                                            <div className="font-semibold text-green-900">{selectedClaim.creditNoteNumber}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-green-700">Credit Amount</div>
                                            <div className="text-2xl font-bold text-green-700">₹{selectedClaim.creditAmount}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                                    <div className="text-sm text-amber-800">
                                        <FiClock className="w-5 h-5 inline mr-2" />
                                        Credit note pending - will be issued after supplier receives goods
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                {!selectedClaim.rmaNumber && (
                                    <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                        Submit Claim to Supplier
                                    </button>
                                )}
                                {selectedClaim.rmaNumber && !selectedClaim.creditNoteNumber && (
                                    <button className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                                        Mark as Returned
                                    </button>
                                )}
                                <button className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                    Print Debit Memo
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
