"use client";

import { useState, useEffect, useRef } from "react";
import { FiCheck, FiX, FiDownload, FiEye, FiShield, FiAlertCircle } from "react-icons/fi";
import { MdVerifiedUser } from "react-icons/md";
import { patientsApi } from "@/lib/api/patients";
import { useAuthStore } from "@/lib/store/auth-store";

const StatCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
    </div>
)

const ConsentCardSkeleton = () => (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-100 rounded-full w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
        <div className="h-16 bg-gray-100 rounded-lg"></div>
    </div>
)

const consentTypes = [
    {
        name: "Data Processing",
        description: "Consent for collection, storage, and processing of personal health data as per DPDPA 2023",
        required: true,
        category: "Essential"
    },
    {
        name: "Marketing Communications",
        description: "Consent to receive promotional messages, health tips, and offers",
        required: false,
        category: "Optional"
    },
    {
        name: "Research Participation",
        description: "Consent to use anonymized data for medical research and studies",
        required: false,
        category: "Optional"
    },
    {
        name: "Third-Party Sharing",
        description: "Consent to share data with insurance providers and healthcare partners",
        required: false,
        category: "Optional"
    }
];

export default function PatientConsentsPage() {
    const { primaryStore } = useAuthStore();
    const [filter, setFilter] = useState("all");
    const [consents, setConsents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (primaryStore?.id) {
            // Debounce API calls to prevent rate limiting
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(() => {
                loadConsents();
            }, 300); // 300ms debounce

            return () => {
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                }
            };
        }
    }, [filter, primaryStore?.id]);

    const loadConsents = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await patientsApi.getAllConsents({
                status: filter === "all" ? undefined : filter,
                page: 1,
                limit: 50
            });

            if (response.success) {
                setConsents(response.data || []);
            } else {
                setError(response.message || "Failed to load consents");
            }
        } catch (err: any) {
            console.error("Error loading consents:", err);

            // Better error messages
            if (err.statusCode === 429) {
                setError("Too many requests. Please wait a moment and try again.");
            } else if (err.statusCode === 404) {
                setError("Consents endpoint not found. Please check backend configuration.");
            } else {
                setError(err.message || "Failed to load consents. Please try again.");
            }
            setConsents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdrawConsent = async (consentId: string) => {
        if (!confirm("Are you sure you want to withdraw this consent?")) {
            return;
        }

        try {
            await patientsApi.withdrawConsent(consentId);
            loadConsents(); // Reload
        } catch (err: any) {
            console.error("Error withdrawing consent:", err);
            alert(err.message || "Failed to withdraw consent");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active": return "bg-green-100 text-green-700 border-green-200";
            case "expired": return "bg-red-100 text-red-700 border-red-200";
            case "withdrawn": return "bg-gray-100 text-gray-700 border-gray-200";
            default: return "bg-blue-100 text-blue-700 border-blue-200";
        }
    };

    const filteredConsents = consents.filter(consent =>
        filter === "all" || consent.status?.toLowerCase() === filter.toLowerCase()
    );

    const stats = {
        active: consents.filter(c => c.status?.toLowerCase() === "active").length,
        expired: consents.filter(c => c.status?.toLowerCase() === "expired").length,
        withdrawn: consents.filter(c => c.status?.toLowerCase() === "withdrawn").length,
        total: consents.length
    };

    return (
        <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
            {/* Fixed Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6 flex-shrink-0">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Patient Consents</h1>
                            <p className="text-sm text-[#64748b]">DPDPA 2023 compliant consent management</p>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
                            <span>{error}</span>
                            <button onClick={loadConsents} className="text-sm underline">Retry</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Stats and Filters */}
            <div className="bg-white border-b border-[#e2e8f0] flex-shrink-0">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {isLoading ? (
                            <>
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </>
                        ) : (
                            <>
                                <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#64748b]">Active</span>
                                        <MdVerifiedUser className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                                </div>

                                <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#64748b]">Expired</span>
                                        <FiAlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                                </div>

                                <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#64748b]">Withdrawn</span>
                                        <FiX className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="text-2xl font-bold text-gray-600">{stats.withdrawn}</div>
                                </div>

                                <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[#64748b]">Total</span>
                                        <FiShield className="w-5 h-5 text-[#0ea5a3]" />
                                    </div>
                                    <div className="text-2xl font-bold text-[#0ea5a3]">{stats.total}</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "all" ? "bg-[#0ea5a3] text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                            disabled={isLoading}
                        >
                            All Consents
                        </button>
                        <button
                            onClick={() => setFilter("active")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "active" ? "bg-green-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                            disabled={isLoading}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilter("expired")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "expired" ? "bg-red-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                            disabled={isLoading}
                        >
                            Expired
                        </button>
                        <button
                            onClick={() => setFilter("withdrawn")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === "withdrawn" ? "bg-gray-500 text-white" : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                }`}
                            disabled={isLoading}
                        >
                            Withdrawn
                        </button>
                    </div>
                </div>
            </div>

            {/* Sticky Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-12 gap-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <div className="col-span-3">Patient</div>
                        <div className="col-span-2">Contact</div>
                        <div className="col-span-2">Consent Type</div>
                        <div className="col-span-2">Last Visit</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="space-y-3">
                        {isLoading ? (
                            <>
                                <ConsentCardSkeleton />
                                <ConsentCardSkeleton />
                                <ConsentCardSkeleton />
                            </>
                        ) : filteredConsents.length > 0 ? (
                            filteredConsents.map((consent) => (
                                <div key={consent.id} className="bg-white border border-[#e2e8f0] rounded-lg hover:shadow-md transition-shadow">
                                    <div className="grid grid-cols-12 gap-4 p-4 items-center">
                                        {/* Patient */}
                                        <div className="col-span-3">
                                            <h3 className="font-semibold text-[#0f172a]">
                                                {consent.patient?.firstName} {consent.patient?.lastName}
                                            </h3>
                                            <p className="text-xs text-[#64748b] mt-1">ID: {consent.patient?.id?.slice(0, 8)}</p>
                                        </div>

                                        {/* Contact */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-[#0f172a]">{consent.patient?.phoneNumber || 'N/A'}</p>
                                            <p className="text-xs text-[#64748b] mt-1">{consent.patient?.email || 'No email'}</p>
                                        </div>

                                        {/* Consent Type */}
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-[#0f172a]">{consent.type}</p>
                                            <p className="text-xs text-[#64748b] mt-1">
                                                Granted: {consent.grantedDate ? new Date(consent.grantedDate).toLocaleDateString() : "N/A"}
                                            </p>
                                        </div>

                                        {/* Last Visit */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-[#0f172a]">
                                                {consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : "No Expiry"}
                                            </p>
                                            <p className="text-xs text-[#64748b] mt-1">Expiry Date</p>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${getStatusColor(consent.status)}`}>
                                                {consent.status?.charAt(0).toUpperCase() + consent.status?.slice(1)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 text-right">
                                            {consent.status?.toLowerCase() === "active" && (
                                                <button
                                                    onClick={() => handleWithdrawConsent(consent.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 ml-auto"
                                                    title="Withdraw Consent"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                    Withdraw
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                                <FiShield className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-[#0f172a] mb-2">No Consents Found</h3>
                                <p className="text-[#64748b]">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
