"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiPackage } from "react-icons/fi";

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

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <FiPackage className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Inventory Defaults</h1>
                    <p className="text-[#64748b]">Configure default settings for inventory management</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">Low Stock Threshold</label>
                        <input
                            type="number"
                            value={formData.lowStockThreshold}
                            onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        />
                        <p className="mt-1 text-xs text-[#64748b]">Alert when stock falls below this number</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">Near Expiry Threshold (days)</label>
                        <input
                            type="number"
                            value={formData.nearExpiryThreshold}
                            onChange={(e) => setFormData({ ...formData, nearExpiryThreshold: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        />
                        <p className="mt-1 text-xs text-[#64748b]">Alert when expiry is within this many days</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">Default Unit of Measure</label>
                    <select
                        value={formData.defaultUoM}
                        onChange={(e) => setFormData({ ...formData, defaultUoM: e.target.value })}
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    >
                        <option value="Units">Units</option>
                        <option value="Strips">Strips</option>
                        <option value="Boxes">Boxes</option>
                        <option value="Bottles">Bottles</option>
                        <option value="Vials">Vials</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">Default GST Slab</label>
                    <select
                        value={formData.defaultGSTSlab}
                        onChange={(e) => setFormData({ ...formData, defaultGSTSlab: e.target.value })}
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    >
                        <option value="0">0% (Exempt)</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                    </select>
                </div>

                <div className="space-y-4">
                    {[
                        { key: "batchTracking", label: "Enable Batch-level Tracking", description: "Track inventory by batch numbers and expiry dates" },
                        { key: "autoGenerateCodes", label: "Auto-generate Item Codes", description: "Automatically create unique codes for new items" },
                        { key: "purchaseRounding", label: "Purchase Rounding", description: "Round purchase quantities to nearest whole number" },
                        { key: "allowNegativeStock", label: "Allow Negative Stock", description: "Permit sales even when stock is zero" }
                    ].map(({ key, label, description }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                            <div>
                                <div className="font-medium text-[#0f172a]">{label}</div>
                                <div className="text-sm text-[#64748b]">{description}</div>
                            </div>
                            <button
                                onClick={() => setFormData({ ...formData, [key]: !formData[key as keyof typeof formData] })}
                                className={`relative w-14 h-7 rounded-full transition-colors ${formData[key as keyof typeof formData] ? "bg-[#0ea5a3]" : "bg-[#cbd5e1]"
                                    }`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${formData[key as keyof typeof formData] ? "translate-x-7" : ""
                                    }`}></div>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-3")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Suppliers
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
