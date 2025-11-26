"use client";

import { useState, useEffect } from "react";
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

    useEffect(() => {
        if (primaryStore?.id) {
            loadConsents();
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
            setError(err.message || "An error occurred");
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
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] p-6">
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

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Compliance Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 flex items-start gap-4">
                    <FiShield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-2">DPDPA 2023 Compliance</h3>
                        <p className="text-sm text-blue-700 mb-3">
                            All patient consents are managed in accordance with the Digital Personal Data Protection Act, 2023.
                            Patients have the right to withdraw consent at any time.
                        </p>
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <FiCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Digital Signatures</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Version Control</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Audit Trail</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {isLoading ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Active</span>
                                    <MdVerifiedUser className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-green-600">{stats.active}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Expired</span>
                                    <FiAlertCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Withdrawn</span>
                                    <FiX className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="text-3xl font-bold text-gray-600">{stats.withdrawn}</div>
                            </div>

                            <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#64748b]">Total</span>
                                    <FiShield className="w-5 h-5 text-[#0ea5a3]" />
                                </div>
                                <div className="text-3xl font-bold text-[#0ea5a3]">{stats.total}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
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

                {/* Consent Types Reference */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 mb-6">
                    <h3 className="font-semibold text-[#0f172a] mb-4">Consent Types</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {consentTypes.map((type) => (
                            <div key={type.name} className="p-4 border border-[#e2e8f0] rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-[#0f172a]">{type.name}</h4>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${type.required ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                        }`}>
                                        {type.category}
                                    </span>
                                </div>
                                <p className="text-sm text-[#64748b]">{type.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Consents List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <ConsentCardSkeleton />
                            <ConsentCardSkeleton />
                        </>
                    ) : filteredConsents.length > 0 ? (
                        filteredConsents.map((consent) => (
                            <div key={consent.id} className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-[#0f172a]">
                                                {consent.patient?.firstName} {consent.patient?.lastName}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(consent.status)}`}>
                                                {consent.status?.charAt(0).toUpperCase() + consent.status?.slice(1)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-[#64748b]">
                                            <span>Patient ID: {consent.patient?.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#f8fafc] rounded-lg">
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Consent Type</div>
                                        <div className="font-medium text-[#0f172a]">{consent.type}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Granted Date</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {consent.grantedDate ? new Date(consent.grantedDate).toLocaleDateString() : "N/A"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Expiry Date</div>
                                        <div className="font-medium text-[#0f172a]">
                                            {consent.expiryDate ? new Date(consent.expiryDate).toLocaleDateString() : "No Expiry"}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[#64748b] mb-1">Status</div>
                                        <div className="flex items-center gap-2">
                                            <MdVerifiedUser className="w-4 h-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-600">Verified</span>
                                        </div>
                                    </div>
                                </div>

                                {consent.status?.toLowerCase() === "active" && (
                                    <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex justify-end">
                                        <button
                                            onClick={() => handleWithdrawConsent(consent.id)}
                                            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Withdraw Consent
                                        </button>
                                    </div>
                                )}
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
    );
}
