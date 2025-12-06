"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck, FiEdit, FiMapPin, FiShield, FiClock, FiUsers, FiTruck, FiArrowRight, FiAward } from "react-icons/fi";
import { onboardingApi } from "@/lib/api/onboarding";
import { toast } from "react-hot-toast";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import { useAuthStore } from "@/lib/store/auth-store";

export default function Step10Page() {
    const { state, setCurrentStep, completeOnboarding } = useOnboarding();
    const router = useRouter();
    const { refreshUserData } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentStep(10);
    }, [setCurrentStep]);

    const handleFinish = async () => {
        setIsSubmitting(true);
        try {
            // Validate required fields
            if (!state.data.storeIdentity.pharmacyName || !state.data.storeIdentity.address ||
                !state.data.storeIdentity.city || !state.data.storeIdentity.state ||
                !state.data.storeIdentity.pinCode || !state.data.storeIdentity.phoneNumber) {
                toast.error("Please complete Step 1 - Store Identity with all required fields");
                setIsSubmitting(false);
                return;
            }

            // Validate PIN code format
            if (!/^\d{6}$/.test(state.data.storeIdentity.pinCode)) {
                toast.error("Invalid PIN code. Must be 6 digits");
                setIsSubmitting(false);
                return;
            }

            // Validate phone number format
            if (!/^[6-9]\d{9}$/.test(state.data.storeIdentity.phoneNumber)) {
                toast.error("Invalid phone number. Must be 10 digits starting with 6-9");
                setIsSubmitting(false);
                return;
            }

            // Prepare licenses array
            const licenses: any[] = [];
            if (state.data.licensing.dlNumber) {
                licenses.push({
                    type: 'Drug License' as const,
                    licenseNumber: state.data.licensing.dlNumber,
                    issuedBy: "State Authority",
                    issuedDate: state.data.licensing.dlValidityStart || new Date().toISOString(),
                    expiryDate: state.data.licensing.dlValidityEnd || new Date().toISOString(),
                });
            }
            if (state.data.licensing.gstin) {
                licenses.push({
                    type: 'GST' as const,
                    licenseNumber: state.data.licensing.gstin,
                    issuedBy: "GST Department",
                    issuedDate: new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                });
            }

            // Prepare operating hours
            const operatingHours: any[] = state.data.timings?.is24x7 ? [] :
                (state.data.timings?.operatingDays || []).map(day => ({
                    dayOfWeek: day as any,
                    openTime: state.data.timings?.openTime || "09:00",
                    closeTime: state.data.timings?.closeTime || "21:00",
                    isClosed: false,
                    lunchStart: state.data.timings?.lunchBreak ? state.data.timings?.lunchStart : null,
                    lunchEnd: state.data.timings?.lunchBreak ? state.data.timings?.lunchEnd : null,
                }));

            // Prepare suppliers
            const suppliers = (state.data.suppliers || []).map(sup => ({
                name: sup.name,
                phone: sup.phone,
                category: sup.category || 'Distributor',
                contactName: sup.name,
                gstin: sup.gstin || null,
                deliveryArea: sup.deliveryArea || null,
                creditTerms: sup.creditTerms || null,
            }));

            // Prepare users
            const users = (state.data.users || []).map(user => ({
                name: user.name,
                phone: user.phone,
                role: user.role,
                pin: user.pin,
            }));

            // Call the backend to create the store with all collected data
            await onboardingApi.completeOnboarding({
                store: {
                    name: state.data.storeIdentity.pharmacyName,
                    displayName: state.data.storeIdentity.displayName || state.data.storeIdentity.pharmacyName,
                    businessType: state.data.storeIdentity.businessType || "Retail Pharmacy",
                    addressLine1: state.data.storeIdentity.address,
                    city: state.data.storeIdentity.city,
                    state: state.data.storeIdentity.state,
                    pinCode: state.data.storeIdentity.pinCode,
                    phoneNumber: state.data.storeIdentity.phoneNumber,
                    email: state.data.storeIdentity.email,
                    gstin: state.data.licensing.gstin,
                    dlNumber: state.data.licensing.dlNumber,
                    pan: state.data.licensing.pan,
                    is24x7: state.data.timings?.is24x7 || false,
                    homeDelivery: state.data.timings?.deliveryAvailable || false,
                },
                licenses,
                operatingHours,
                suppliers,
                users,
                pos: state.data.pos, // Add POS configuration
                inventory: state.data.inventory, // Add inventory settings
            });

            // Mark onboarding as complete in the context
            completeOnboarding();

            // Refresh user data to update store information
            await refreshUserData();

            // Wait a bit for the auth state to update
            await new Promise(resolve => setTimeout(resolve, 300));

            toast.success("Store setup completed successfully!");

            // Force navigation to dashboard
            window.location.href = "/dashboard/overview";
        } catch (error: any) {
            console.error("Failed to complete onboarding:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to create store. Please try again.";
            toast.error(errorMessage);
            setIsSubmitting(false);
        }
    };

    const ReviewSection = ({ title, icon, onEdit, children }: { title: string, icon: React.ReactNode, onEdit: () => void, children: React.ReactNode }) => (
        <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-white hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-100 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg">
                        {icon}
                    </div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                <button
                    onClick={onEdit}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium opacity-0 group-hover:opacity-100"
                >
                    <FiEdit size={12} />
                    Edit
                </button>
            </div>
            {children}
        </div>
    );

    return (
        <OnboardingCard
            title="Review & Finalize"
            description="Review your setup before entering the dashboard"
            icon={<FiCheck size={28} />}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    {/* Store Identity */}
                    <ReviewSection
                        title="Store Identity"
                        icon={<FiMapPin size={18} />}
                        onEdit={() => router.push("/onboarding/step-1")}
                    >
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div>
                                <div className="text-xs text-gray-500 mb-0.5">Pharmacy Name</div>
                                <div className="font-medium text-gray-900">{state.data.storeIdentity.pharmacyName || "Not set"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-0.5">Business Type</div>
                                <div className="font-medium text-gray-900">{state.data.storeIdentity.businessType || "Not set"}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-xs text-gray-500 mb-0.5">Location</div>
                                <div className="font-medium text-gray-900">
                                    {[state.data.storeIdentity.city, state.data.storeIdentity.state].filter(Boolean).join(", ") || "Not set"}
                                </div>
                            </div>
                        </div>
                    </ReviewSection>

                    {/* Licensing */}
                    <ReviewSection
                        title="Licensing"
                        icon={<FiShield size={18} />}
                        onEdit={() => router.push("/onboarding/step-2")}
                    >
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                            <div>
                                <div className="text-xs text-gray-500 mb-0.5">Drug License</div>
                                <div className="font-medium text-gray-900">{state.data.licensing.dlNumber || "Not set"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-0.5">GSTIN</div>
                                <div className="font-medium text-gray-900">{state.data.licensing.gstin || "Not set"}</div>
                            </div>
                        </div>
                    </ReviewSection>

                    {/* Timings */}
                    <ReviewSection
                        title="Timings"
                        icon={<FiClock size={18} />}
                        onEdit={() => router.push("/onboarding/step-3")}
                    >
                        <div className="text-sm">
                            <div className="text-xs text-gray-500 mb-0.5">Operating Hours</div>
                            <div className="font-medium text-gray-900">
                                {state.data.timings?.is24x7
                                    ? "24x7 Operation"
                                    : `${state.data.timings?.openTime || "09:00"} - ${state.data.timings?.closeTime || "21:00"}`}
                            </div>
                        </div>
                    </ReviewSection>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                        <div className="text-2xl font-bold text-emerald-600">{state.data.suppliers.length}</div>
                        <div className="text-xs font-medium text-emerald-800 mt-1 flex items-center justify-center gap-1">
                            <FiTruck size={12} /> Suppliers
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                        <div className="text-2xl font-bold text-blue-600">{state.data.users.length + 1}</div>
                        <div className="text-xs font-medium text-blue-800 mt-1 flex items-center justify-center gap-1">
                            <FiUsers size={12} /> Team
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl text-center">
                        <div className="text-2xl font-bold text-purple-600">{state.completedSteps.length}/10</div>
                        <div className="text-xs font-medium text-purple-800 mt-1 flex items-center justify-center gap-1">
                            <FiCheck size={12} /> Steps
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-center text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>

                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                            <FiAward size={32} className="text-white" />
                        </div>
                    </div>
                    <div className="font-bold text-lg mb-2">Setup Finalized!</div>
                    <p className="text-emerald-50 text-sm mb-6 max-w-sm mx-auto">
                        Your pharmacy is ready to go. Click below to enter your dashboard and start managing your store.
                    </p>
                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-white text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                                Creating your store...
                            </>
                        ) : (
                            <>
                                Enter Dashboard
                                <FiArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Back Button */}
                <div className="text-center">
                    <button
                        onClick={() => router.push("/onboarding/step-9")}
                        className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Data Import
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
