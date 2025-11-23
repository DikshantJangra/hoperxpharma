"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck, FiEdit } from "react-icons/fi";
import { onboardingApi } from "@/lib/api/onboarding";
import { toast } from "react-hot-toast";

export default function Step10Page() {
    const { state, setCurrentStep, completeOnboarding } = useOnboarding();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentStep(10);
    }, [setCurrentStep]);

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            // Call the backend to create the store with all collected data
            await onboardingApi.completeOnboarding({
                store: {
                    name: state.data.storeIdentity.pharmacyName || "My Pharmacy",
                    gstin: state.data.licensing.gstin,
                    dlNumber: state.data.licensing.dlNumber,
                    addressLine1: state.data.storeIdentity.address || "",
                    city: state.data.storeIdentity.city || "",
                    state: state.data.storeIdentity.state || "",
                    pinCode: state.data.storeIdentity.pinCode || "",
                    phoneNumber: "", // Add if you have it in storeIdentity
                },
                licenses: state.data.licensing.dlNumber ? [{
                    type: 'Drug License' as const,
                    licenseNumber: state.data.licensing.dlNumber,
                    issuedBy: "State Authority",
                    issuedDate: state.data.licensing.dlValidityStart || new Date().toISOString().split('T')[0],
                    expiryDate: state.data.licensing.dlValidityEnd || new Date().toISOString().split('T')[0],
                }] : [],
                operatingHours: state.data.timings?.operatingDays?.map(day => ({
                    dayOfWeek: day as any,
                    openTime: state.data.timings?.openTime || "09:00",
                    closeTime: state.data.timings?.closeTime || "21:00",
                    isClosed: false,
                })) || [],
            });

            // Mark onboarding as complete in the database
            await onboardingApi.saveProgress({
                currentStep: 10,
                completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                data: state.data,
                isComplete: true,
            });

            // Mark onboarding as complete in the context
            completeOnboarding();

            toast.success("🎉 Store created successfully!");

            // Redirect to dashboard
            router.push("/dashboard");
        } catch (error: any) {
            console.error("Failed to complete onboarding:", error);
            toast.error(error?.message || "Failed to create store. Please try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-[#0f172a] mb-2">Review & Finalize</h1>
                <p className="text-[#64748b]">Review your setup before entering the dashboard</p>
            </div>

            <div className="space-y-4">
                {/* Store Identity */}
                <div className="p-6 border border-[#e2e8f0] rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0f172a]">Store Identity</h3>
                        <button
                            onClick={() => router.push("/onboarding/step-1")}
                            className="text-[#0ea5a3] hover:text-[#0d9391] flex items-center gap-2 text-sm font-medium"
                        >
                            <FiEdit className="w-4 h-4" />
                            Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-[#64748b]">Pharmacy Name</div>
                            <div className="font-medium text-[#0f172a]">{state.data.storeIdentity.pharmacyName || "Not set"}</div>
                        </div>
                        <div>
                            <div className="text-[#64748b]">Business Type</div>
                            <div className="font-medium text-[#0f172a]">{state.data.storeIdentity.businessType || "Not set"}</div>
                        </div>
                        <div>
                            <div className="text-[#64748b]">City</div>
                            <div className="font-medium text-[#0f172a]">{state.data.storeIdentity.city || "Not set"}</div>
                        </div>
                        <div>
                            <div className="text-[#64748b]">State</div>
                            <div className="font-medium text-[#0f172a]">{state.data.storeIdentity.state || "Not set"}</div>
                        </div>
                    </div>
                </div>

                {/* Licensing */}
                <div className="p-6 border border-[#e2e8f0] rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0f172a]">Licensing & Compliance</h3>
                        <button
                            onClick={() => router.push("/onboarding/step-2")}
                            className="text-[#0ea5a3] hover:text-[#0d9391] flex items-center gap-2 text-sm font-medium"
                        >
                            <FiEdit className="w-4 h-4" />
                            Edit
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-[#64748b]">Drug License</div>
                            <div className="font-medium text-[#0f172a]">{state.data.licensing.dlNumber || "Not set"}</div>
                        </div>
                        <div>
                            <div className="text-[#64748b]">GSTIN</div>
                            <div className="font-medium text-[#0f172a]">{state.data.licensing.gstin || "Not set"}</div>
                        </div>
                    </div>
                </div>

                {/* Timings */}
                <div className="p-6 border border-[#e2e8f0] rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[#0f172a]">Store Timings</h3>
                        <button
                            onClick={() => router.push("/onboarding/step-3")}
                            className="text-[#0ea5a3] hover:text-[#0d9391] flex items-center gap-2 text-sm font-medium"
                        >
                            <FiEdit className="w-4 h-4" />
                            Edit
                        </button>
                    </div>
                    <div className="text-sm">
                        <div className="text-[#64748b]">Operating Hours</div>
                        <div className="font-medium text-[#0f172a]">
                            {state.data.timings?.is24x7
                                ? "24x7 Operation"
                                : `${state.data.timings?.openTime || "09:00"} - ${state.data.timings?.closeTime || "21:00"}`}
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[#f8fafc] rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#0ea5a3]">{state.data.suppliers.length}</div>
                        <div className="text-sm text-[#64748b]">Suppliers</div>
                    </div>
                    <div className="p-4 bg-[#f8fafc] rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#0ea5a3]">{state.data.users.length + 1}</div>
                        <div className="text-sm text-[#64748b]">Team Members</div>
                    </div>
                    <div className="p-4 bg-[#f8fafc] rounded-lg text-center">
                        <div className="text-2xl font-bold text-[#0ea5a3]">{state.completedSteps.length}/10</div>
                        <div className="text-sm text-[#64748b]">Steps Complete</div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-green-900 font-semibold mb-2">🎉 Setup Complete!</div>
                    <p className="text-sm text-green-700">
                        Your pharmacy is ready to go. Click below to enter your dashboard and start managing your store.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-9")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                            Creating your store...
                        </>
                    ) : (
                        <>
                            <FiCheck className="w-6 h-6" />
                            Finish Setup & Enter Dashboard
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
