"use client";

import { useState, useEffect } from "react";
import { FiClock, FiCheck, FiX, FiPhone, FiCalendar, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";

const RefillCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
        <div className="h-20 bg-gray-100 rounded-lg mb-4"></div>
        <div className="border-t border-[#e2e8f0] pt-4 flex items-center justify-between">
            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded-lg w-1/4"></div>
        </div>
    </div>
)

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
    </div>
)


export default function PatientRefillsPage() {
    const { primaryStore } = useAuthStore();
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [refills, setRefills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (primaryStore?.id) {
            loadRefills();
        }
    }, [filter, primaryStore?.id]);

    const loadRefills = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await patientsApi.getRefillsDue({
                status: filter === "all" ? undefined : filter,
                search: searchQuery
            });

            if (response.success) {
                setRefills(response.data || []);
            } else {
                setError(response.message || "Failed to load refills");
            }
        } catch (err: any) {
            console.error("Error loading refills:", err);
            setError(err.message || "An error occurred");
            setRefills([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessRefill = async (refill: any) => {
        try {
            await patientsApi.processRefill(refill.patientId, {
                prescriptionId: refill.prescriptionId,
                expectedRefillDate: refill.expectedRefillDate,
                adherenceRate: 1.0
            });

            // Reload refills
            loadRefills();
        } catch (err: any) {
            console.error("Error processing refill:", err);
            alert(err.message || "Failed to process refill");
        }
    };

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

    const filteredRefills = refills.filter(refill => {
        const matchesSearch = searchQuery === "" ||
            refill.patient?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refill.patient?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refill.patient?.phoneNumber?.includes(searchQuery);
        return matchesSearch;
    });

    const stats = {
        overdue: refills.filter(r => r.status === "overdue").length,
        due: refills.filter(r => r.status === "due").length,
        upcoming: refills.filter(r => r.status === "upcoming").length,
        total: refills.length
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Prescription Refills</h1>
                    <p className="text-sm text-[#64748b]">Manage recurring prescriptions and auto-refills</p>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={loadRefills} className="text-sm underline">Retry</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {isLoading ? (
                        <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                    ) : (
                        <>
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Overdue</span>
                                    <FiAlertTriangle className="w-5 h-5 text-red-500" />
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
                        </>
                    )}
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
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                disabled={isLoading}>
                                All
                            </button>
                            <button
                                onClick={() => setFilter("overdue")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "overdue" ? "bg-red-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                disabled={isLoading}>
                                Overdue
                            </button>
                            <button
                                onClick={() => setFilter("due")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "due" ? "bg-amber-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                disabled={isLoading}>
                                Due
                            </button>
                            <button
                                onClick={() => setFilter("upcoming")}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "upcoming" ? "bg-blue-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                                disabled={isLoading}>
                                Upcoming
                            </button>
                        </div>
                    </div>
                </div>

                {/* Refills List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <RefillCardSkeleton />
                            <RefillCardSkeleton />
                        </>
                    ) : filteredRefills.length > 0 ? (
                        filteredRefills.map((refill) => (
                            <div key={refill.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">
                                                {refill.patient?.firstName} {refill.patient?.lastName}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refill.status)}`}>
                                                {getStatusLabel(refill.status)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                            <span>ID: {refill.patient?.id}</span>
                                            <span className="flex items-center gap-1">
                                                <FiPhone className="w-4 h-4" />
                                                {refill.patient?.phoneNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleProcessRefill(refill)}
                                            className="px-4 py-2 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                                        >
                                            <FiCheck className="w-4 h-4" />
                                            Process Refill
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#f8fafc] rounded-lg">
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Expected Refill</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {new Date(refill.expectedRefillDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Prescription ID</div>
                                        <div className="font-medium text-[#0f172a]">{refill.prescriptionId}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Adherence Rate</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {Math.round(refill.adherenceRate * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                            <MdLocalPharmacy className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Refills Found</h3>
                            <p className="text-[#64748b]">Try adjusting your filters or search query</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
