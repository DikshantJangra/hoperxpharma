"use client";

import { useState } from "react";
import { FiSearch, FiClock, FiAlertCircle, FiUser, FiArrowRight } from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";

const mockPrescriptions = [
    { id: "rx001", patientName: "Rajesh Kumar", rxId: "RX-2024-001", doctor: "Dr. Anjali Patel", timeInQueue: "15 min", priority: "urgent", isControlled: false, drugCount: 2, assignedTo: null, status: "new" },
    { id: "rx002", patientName: "Priya Sharma", rxId: "RX-2024-002", doctor: "Dr. Rahul Mehta", timeInQueue: "45 min", priority: "normal", isControlled: true, drugCount: 1, assignedTo: "John Doe", status: "in-progress" },
    { id: "rx003", patientName: "Amit Verma", rxId: "RX-2024-003", doctor: "Dr. Sunita Rao", timeInQueue: "30 min", priority: "normal", isControlled: false, drugCount: 3, assignedTo: null, status: "new" },
    { id: "rx004", patientName: "Sneha Reddy", rxId: "RX-2024-004", doctor: "Dr. Vikram Singh", timeInQueue: "2 hr", priority: "normal", isControlled: false, drugCount: 1, assignedTo: null, status: "ready" }
];

export default function QueuePage() {
    const [selectedId, setSelectedId] = useState("rx001");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const filteredPrescriptions = mockPrescriptions.filter(rx => {
        const matchesSearch = rx.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rx.rxId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || rx.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const selectedRx = mockPrescriptions.find(rx => rx.id === selectedId);

    const stats = {
        total: mockPrescriptions.length,
        urgent: mockPrescriptions.filter(rx => rx.priority === "urgent").length,
        controlled: mockPrescriptions.filter(rx => rx.isControlled).length,
        avgWaitTime: "35 min"
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescription Queue</h1>
                    <p className="text-sm text-[#64748b]">Overview of all prescriptions in the pipeline</p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <MdLocalPharmacy className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Total in Queue</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Urgent</div>
                            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FiAlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Controlled</div>
                            <div className="text-2xl font-bold text-amber-600">{stats.controlled}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <FiClock className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-[#64748b]">Avg Wait Time</div>
                            <div className="text-2xl font-bold text-green-600">{stats.avgWaitTime}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Prescription List (40%) */}
                <div className="w-2/5 border-r border-[#e2e8f0] bg-white flex flex-col">
                    <div className="p-4 border-b border-[#e2e8f0]">
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by patient name or Rx ID..."
                                className="w-full pl-10 pr-4 py-2 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div className="flex gap-2">
                            {["all", "new", "in-progress", "ready"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                        }`}
                                >
                                    {status === "all" ? "All" : status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredPrescriptions.map((rx) => (
                            <div
                                key={rx.id}
                                onClick={() => setSelectedId(rx.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedId === rx.id ? "border-[#0ea5a3] bg-emerald-50" :
                                        rx.priority === "urgent" ? "border-red-200 bg-red-50 hover:border-red-300" :
                                            rx.isControlled ? "border-amber-200 bg-amber-50 hover:border-amber-300" :
                                                rx.status === "ready" ? "border-green-200 bg-green-50 hover:border-green-300" :
                                                    "border-[#e2e8f0] hover:border-[#cbd5e1]"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-[#0f172a]">{rx.patientName}</h3>
                                        <p className="text-sm text-[#64748b]">{rx.rxId}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {rx.priority === "urgent" && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">URGENT</span>
                                        )}
                                        {rx.isControlled && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded">C-II</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-sm text-[#64748b]">
                                    <span className="flex items-center gap-1">
                                        <FiClock className="w-4 h-4" />
                                        {rx.timeInQueue}
                                    </span>
                                    <span>{rx.drugCount} drug{rx.drugCount > 1 ? "s" : ""}</span>
                                </div>
                                {rx.assignedTo && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-[#0ea5a3]">
                                        <FiUser className="w-3 h-3" />
                                        Assigned to {rx.assignedTo}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Prescription Detail (60%) */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedRx ? (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Patient Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Patient Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Name</div>
                                        <div className="font-medium text-[#0f172a]">{selectedRx.patientName}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">DOB</div>
                                        <div className="font-medium text-[#0f172a]">June 15, 1985</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Phone</div>
                                        <div className="font-medium text-[#0f172a]">+91 98765 43210</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">Allergies</div>
                                        <div className="font-medium text-red-600">Penicillin</div>
                                    </div>
                                </div>
                            </div>

                            {/* Doctor Info */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescriber Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-[#64748b]">Doctor</div>
                                        <div className="font-medium text-[#0f172a]">{selectedRx.doctor}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-[#64748b]">License</div>
                                        <div className="font-medium text-[#0f172a]">MH-12345</div>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Details */}
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <h2 className="text-lg font-semibold text-[#0f172a] mb-4">Prescription Details</h2>
                                <div className="space-y-4">
                                    <div className="p-4 bg-[#f8fafc] rounded-lg">
                                        <div className="font-semibold text-[#0f172a] mb-2">Warfarin 5mg</div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-[#64748b]">Dosage:</span>
                                                <span className="ml-2 text-[#0f172a]">5mg</span>
                                            </div>
                                            <div>
                                                <span className="text-[#64748b]">Quantity:</span>
                                                <span className="ml-2 text-[#0f172a]">30 tablets</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-sm">
                                            <span className="text-[#64748b]">Sig:</span>
                                            <span className="ml-2 text-[#0f172a]">Take 1 tablet daily at bedtime</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button className="flex-1 px-6 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center justify-center gap-2">
                                    {selectedRx.assignedTo ? "Continue Verification" : "Assign to Me & Start"}
                                    <FiArrowRight className="w-5 h-5" />
                                </button>
                                <button className="px-6 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors">
                                    Print
                                </button>
                                <button className="px-6 py-3 border border-amber-300 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-colors">
                                    Hold
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#64748b]">
                            Select a prescription to view details
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
