"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiPackage, FiAlertCircle, FiSettings, FiCheck } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step4Page() {
    const { state, updateInventory, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        lowStockThreshold: state.data.inventory?.lowStockThreshold || 10,
        nearExpiryThreshold: state.data.inventory?.nearExpiryThreshold || 90,
        defaultUoM: state.data.inventory?.defaultUoM || "Units",
        purchaseRounding: state.data.inventory?.purchaseRounding || false,
        batchTracking: state.data.inventory?.batchTracking || true,
        autoGenerateCodes: state.data.inventory?.autoGenerateCodes || true,
        allowNegativeStock: state.data.inventory?.allowNegativeStock || false,
        defaultGSTSlab: state.data.inventory?.defaultGSTSlab || "12"
    });

    useEffect(() => {
        setCurrentStep(4);
    }, [setCurrentStep]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateInventory(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    const handleNext = () => {
        updateInventory(formData);
        markStepComplete(4);
        router.push("/onboarding/step-5");
    };

    const handleBack = () => {
        updateInventory(formData);
        router.push("/onboarding/step-3");
    };

    return (
        <OnboardingCard
            title="Inventory Defaults"
            description="Configure default settings for inventory management"
            icon={<FiPackage size={28} />}
        >
            <div className="space-y-8">
                {/* Thresholds */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Low Stock Threshold
                        </label>
                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <FiAlertCircle size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.lowStockThreshold}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty or valid positive integers only
                                    if (value === '') {
                                        setFormData({ ...formData, lowStockThreshold: 0 });
                                    } else if (/^\d+$/.test(value)) {
                                        // Remove leading zeros and convert to number
                                        const num = parseInt(value, 10);
                                        setFormData({ ...formData, lowStockThreshold: num });
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                                placeholder="10"
                            />
                        </div>
                        <p className="mt-1.5 ml-1 text-xs text-gray-400">Alert when stock falls below this number</p>
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Near Expiry Threshold (days)
                        </label>
                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <FiAlertCircle size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.nearExpiryThreshold}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow empty or valid positive integers only
                                    if (value === '') {
                                        setFormData({ ...formData, nearExpiryThreshold: 0 });
                                    } else if (/^\d+$/.test(value)) {
                                        // Remove leading zeros and convert to number
                                        const num = parseInt(value, 10);
                                        setFormData({ ...formData, nearExpiryThreshold: num });
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                                placeholder="90"
                            />
                        </div>
                        <p className="mt-1.5 ml-1 text-xs text-gray-400">Alert when expiry is within this many days</p>
                    </div>
                </div>

                {/* Defaults */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Default Unit of Measure
                        </label>
                        <div className="relative">
                            <select
                                value={formData.defaultUoM}
                                onChange={(e) => setFormData({ ...formData, defaultUoM: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none"
                            >
                                <option value="Units">Units</option>
                                <option value="Strips">Strips</option>
                                <option value="Boxes">Boxes</option>
                                <option value="Bottles">Bottles</option>
                                <option value="Vials">Vials</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Default GST Slab
                        </label>
                        <div className="relative">
                            <select
                                value={formData.defaultGSTSlab}
                                onChange={(e) => setFormData({ ...formData, defaultGSTSlab: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none"
                            >
                                <option value="0">0% (Exempt)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                    {[
                        { key: "batchTracking", label: "Enable Batch-level Tracking", description: "Track inventory by batch numbers and expiry dates" },
                        { key: "autoGenerateCodes", label: "Auto-generate Item Codes", description: "Automatically create unique codes for new items" },
                        { key: "purchaseRounding", label: "Purchase Rounding", description: "Round purchase quantities to nearest whole number" },
                        { key: "allowNegativeStock", label: "Allow Negative Stock", description: "Permit sales even when stock is zero" }
                    ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-100 transition-colors">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">{label}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{description}</div>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, [key]: !formData[key as keyof typeof formData] })}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${formData[key as keyof typeof formData] ? "bg-emerald-500" : "bg-gray-300"}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData[key as keyof typeof formData] ? "translate-x-6" : ""}`}></div>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Navigation */}
                <div className="pt-4 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        Continue to Suppliers
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
