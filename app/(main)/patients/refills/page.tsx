"use client";

import { useState } from "react";
import { FiClock, FiCheck, FiX, FiPhone, FiCalendar, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";

const mockRefills = [
    {
        id: "RF001",
        patientName: "Rajesh Kumar",
        patientId: "P12345",
        phone: "+91 98765 43210",
        medication: "Atorvastatin 10mg",
        lastFilled: "2025-01-15",
        nextDue: "2025-02-15",
        refillsRemaining: 3,
        doctorName: "Dr. Sharma",
        status: "due",
        autoRefill: true
    },
    {
        id: "RF002",
        patientName: "Priya Singh",
        patientId: "P12346",
        phone: "+91 98765 43211",
        medication: "Metformin 500mg",
        lastFilled: "2025-01-10",
        nextDue: "2025-02-20",
        refillsRemaining: 5,
        doctorName: "Dr. Patel",
        status: "upcoming",
        autoRefill: false
    },
    {
        id: "RF003",
        patientName: "Amit Verma",
        patientId: "P12347",
        phone: "+91 98765 43212",
        medication: "Lisinopril 5mg",
        lastFilled: "2024-12-20",
        nextDue: "2025-01-20",
        refillsRemaining: 0,
        doctorName: "Dr. Gupta",
        status: "overdue",
        autoRefill: false
    },
    {
        id: "RF004",
        patientName: "Sunita Reddy",
        patientId: "P12348",
        phone: "+91 98765 43213",
        medication: "Levothyroxine 50mcg",
        lastFilled: "2025-01-18",
        nextDue: "2025-02-18",
        refillsRemaining: 2,
        doctorName: "Dr. Iyer",
        status: "active",
        autoRefill: true
    }
];

export default function PatientRefillsPage() {
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const getStatusColor = (status: string) => {
        switch (status) {
            case "overdue": return "bg-red-100 text-red-700 border-red-200";
            case "due": return "bg-amber-100 text-amber-700 border-amber-200";
            case "upcoming": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-green-100 text-green-700 border-green-200";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "overdue": return "Overdue";
            case "due": return "Due Now";
            case "upcoming": return "Upcoming";
            default: return "Active";
        }
    };

    const filteredRefills = mockRefills.filter(refill => {
        const matchesFilter = filter === "all" || refill.status === filter;
        const matchesSearch = refill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refill.medication.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        overdue: mockRefills.filter(r => r.status === "overdue").length,
        due: mockRefills.filter(r => r.status === "due").length,
        upcoming: mockRefills.filter(r => r.status === "upcoming").length,
        total: mockRefills.length
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescription Refills</h1>
                    <p className="text-sm text-[#64748b]">Manage recurring prescriptions and auto-refills</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Overdue</span>
                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Due Now</span>
                            <FiClock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="text-3xl font-bold text-amber-600">{stats.due}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Upcoming</span>
                            <FiCalendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600">{stats.upcoming}</div>
                    </div>

                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#64748b]">Total Active</span>
                            <MdLocalPharmacy className="w-5 h-5 text-[#0ea5a3]" />
                        </div>
                        <div className="text-3xl font-bold text-[#0ea5a3]">{stats.total}</div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by patient name or medication..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
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
                                onClick={() => setFilter("overdue")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "overdue" ? "bg-red-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Overdue
                            </button>
                            <button
                                onClick={() => setFilter("due")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "due" ? "bg-amber-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Due
                            </button>
                            <button
                                onClick={() => setFilter("upcoming")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "upcoming" ? "bg-blue-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                Upcoming
                            </button>
                        </div>
                    </div>
                </div>

                {/* Refills List */}
                <div className="space-y-4">
                    {filteredRefills.map((refill) => (
                        <div key={refill.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-[#0f172a]">{refill.patientName}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refill.status)}`}>
                                            {getStatusLabel(refill.status)}
                                        </span>
                                        {refill.autoRefill && (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                                                <FiRefreshCw className="w-3 h-3" />
                                                Auto-Refill
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                        <span>ID: {refill.patientId}</span>
                                        <span className="flex items-center gap-1">
                                            <FiPhone className="w-4 h-4" />
                                            {refill.phone}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2">
                                        <FiCheck className="w-4 h-4" />
                                        Process Refill
                                    </button>
                                    <button className="px-4 py-2 border border-[#cbd5e1] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors">
                                        Contact
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#f8fafc] rounded-lg">
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Medication</div>
                                    <div className="font-medium text-[#0f172a]">{refill.medication}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Last Filled</div>
                                    <div className="font-medium text-[#0f172a]">{new Date(refill.lastFilled).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Next Due</div>
                                    <div className="font-medium text-[#0f172a]">{new Date(refill.nextDue).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-[#64748b] mb-1">Refills Remaining</div>
                                    <div className={`font-medium ${refill.refillsRemaining === 0 ? 'text-red-600' : 'text-[#0f172a]'}`}>
                                        {refill.refillsRemaining} {refill.refillsRemaining === 0 && "(Needs Approval)"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-sm">
                                <div className="text-[#64748b]">
                                    Prescribed by: <span className="font-medium text-[#0f172a]">{refill.doctorName}</span>
                                </div>
                                {refill.refillsRemaining === 0 && (
                                    <button className="text-[#0ea5a3] hover:text-[#0d9391] font-medium flex items-center gap-2">
                                        <FiPhone className="w-4 h-4" />
                                        Request Doctor Approval
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredRefills.length === 0 && (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                        <MdLocalPharmacy className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Refills Found</h3>
                        <p className="text-[#64748b]">Try adjusting your filters or search query</p>
                    </div>
                )}
            </div>
        </div>
    );
}
