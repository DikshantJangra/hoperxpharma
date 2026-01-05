"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { FiArrowRight, FiLock, FiCheck } from "react-icons/fi";
import { MdStorefront, MdWarehouse, MdLocalHospital, MdDomain } from "react-icons/md";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTourStore } from "@/lib/store/tour-store";

const BUSINESS_TYPES = [
    {
        id: "Retail Pharmacy",
        name: "Retail Pharmacy",
        description: "Independent and community pharmacies focused on patient care and retail efficiency.",
        icon: MdStorefront,
        color: "emerald",
        available: true,
        features: [
            "Smart Point of Sale (POS)",
            "Prescription Management",
            "Inventory & Expiry Tracking",
            "Customer Loyalty Programs"
        ]
    },
    {
        id: "Wholesale Pharmacy",
        name: "Wholesale Pharmacy",
        description: "B2B distributors supplying medicines and equipment to retailers, hospitals, and clinics.",
        icon: MdWarehouse,
        color: "blue",
        available: false,
        features: [
            "B2B Sales & Credit Management",
            "Bulk Inventory Operations",
            "Route & Delivery Tracking",
            "Purchase Order Automation"
        ]
    },
    {
        id: "Hospital-based Pharmacy",
        name: "Hospital Pharmacy",
        description: "In-house pharmacies serving inpatients (IPD) and outpatients (OPD) within medical centers.",
        icon: MdLocalHospital,
        color: "purple",
        available: false,
        features: [
            "IPD/OPD Billing Workflows",
            "Ward & OT Stock Management",
            "Doctor & Department Mapping",
            "Insurance & TPA Processing"
        ]
    },
    {
        id: "Multi-store Chain",
        name: "Multi-store Chain",
        description: "Centralized management for pharmacy chains to monitor and control operations across branches.",
        icon: MdDomain,
        color: "orange",
        available: false,
        features: [
            "Central 360° Dashboard",
            "Inter-branch Stock Transfers",
            "Centralized Procurement",
            "Consolidated Financial Reports"
        ]
    }
];

export default function BusinessTypeSelectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams?.get("mode") as "demo" | "real" | null;

    const { setMode, updateStoreIdentity } = useOnboarding();
    const { refreshUserData } = useAuthStore();
    const { setShouldAutoStart } = useTourStore();

    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTypeSelect = (typeId: string, available: boolean) => {
        if (!available) return;
        setSelectedType(typeId);
    };

    const handleContinue = async () => {
        if (!selectedType) {
            toast.error("Please select a business type");
            return;
        }

        setLoading(true);

        try {
            if (mode === "demo") {
                // Demo flow: Create demo store with selected business type
                await setMode("DEMO", selectedType);
                toast.success("Demo store created successfully!");

                // Refresh auth store to detect new store
                await refreshUserData();

                // Auto-start tour
                setShouldAutoStart(true);

                setTimeout(() => {
                    router.push("/dashboard/overview");
                }, 1000);
            } else {
                // Real flow: Store selection in context and proceed to Step 1
                updateStoreIdentity({ businessType: [selectedType] });
                toast.success("Let's set up your store!");
                router.push("/onboarding/step-1");
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const getColorClasses = (color: string, isSelected: boolean, available: boolean) => {
        if (!available) {
            return {
                card: "border-gray-200 bg-gray-50/50 cursor-not-allowed opacity-70",
                icon: "bg-gray-100 text-gray-400",
                badge: "bg-gray-100 text-gray-500"
            };
        }

        const colors: Record<string, { card: string; icon: string; badge: string }> = {
            emerald: {
                card: isSelected
                    ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30",
                icon: isSelected ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-emerald-500",
                badge: "bg-emerald-100 text-emerald-700"
            },
            blue: {
                card: isSelected
                    ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30",
                icon: isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-blue-500",
                badge: "bg-blue-100 text-blue-700"
            },
            purple: {
                card: isSelected
                    ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/10"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/30",
                icon: isSelected ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-purple-500",
                badge: "bg-purple-100 text-purple-700"
            },
            orange: {
                card: isSelected
                    ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30",
                icon: isSelected ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-orange-500",
                badge: "bg-orange-100 text-orange-700"
            }
        };

        return colors[color] || colors.emerald;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
            {/* Premium Mesh Background */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-emerald-500/3 blur-3xl"></div>
            </div>

            {/* Top Left Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Logo size="lg" showText={true} />
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
                <div className="max-w-5xl w-full mx-auto animate-in fade-in zoom-in duration-500">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-4">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            {mode === "demo" ? "DEMO MODE" : "REAL DATA SETUP"}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Select Your Business Type
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Choose the type of pharmacy business you operate. This helps us customize your experience.
                        </p>
                    </div>

                    {/* Business Type Cards */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        {BUSINESS_TYPES.map((type) => {
                            const isSelected = selectedType === type.id;
                            const colorClasses = getColorClasses(type.color, isSelected, type.available);
                            const IconComponent = type.icon;

                            return (
                                <div
                                    key={type.id}
                                    onClick={() => handleTypeSelect(type.id, type.available)}
                                    className={`
                                        relative p-5 rounded-2xl border-2 transition-all duration-300
                                        ${colorClasses.card}
                                        ${type.available ? "cursor-pointer" : ""}
                                    `}
                                >
                                    {/* Coming Soon Badge */}
                                    {!type.available && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                                            <FiLock size={10} />
                                            Coming Soon
                                        </div>
                                    )}

                                    {/* Available Badge */}
                                    {type.available && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                            <FiCheck size={10} />
                                            Available
                                        </div>
                                    )}

                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-1.5 h-12 bg-emerald-500 rounded-r-full"></div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className={`p-3 rounded-xl ${colorClasses.icon} transition-colors`}>
                                            <IconComponent size={28} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-lg mb-1 ${type.available ? "text-gray-900" : "text-gray-500"}`}>
                                                {type.name}
                                            </h3>
                                            <p className={`text-sm mb-3 leading-relaxed ${type.available ? "text-gray-600" : "text-gray-400"}`}>
                                                {type.description}
                                            </p>

                                            {/* Features */}
                                            <div className="flex flex-wrap gap-2">
                                                {type.features.slice(0, 3).map((feature, idx) => (
                                                    <span
                                                        key={idx}
                                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${type.available ? colorClasses.badge : "bg-gray-100 text-gray-400"
                                                            }`}
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                                {type.features.length > 3 && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                        +{type.features.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Continue Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedType || loading}
                            className={`
                                px-10 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3
                                ${selectedType && !loading
                                    ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {mode === "demo" ? "Creating Demo Store..." : "Starting Setup..."}
                                </>
                            ) : (
                                <>
                                    Continue
                                    <FiArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Back Link */}
                    <div className="text-center mt-6">
                        <button
                            onClick={() => router.push("/onboarding/welcome")}
                            className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                            ← Back to options
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-center py-4">
                <p className="text-gray-400 text-xs">
                    More business types coming soon. We're working hard to bring you the best experience.
                </p>
            </div>
        </div>
    );
}
