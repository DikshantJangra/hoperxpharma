"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiTruck, FiPlus } from "react-icons/fi";

export default function Step5Page() {
    const { state, addSupplier, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [showForm, setShowForm] = useState(state.data.suppliers.length === 0);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        gstin: "",
        deliveryArea: "",
        creditTerms: "COD"
    });

    useEffect(() => {
        setCurrentStep(5);
    }, [setCurrentStep]);

    const handleAdd = () => {
        if (formData.name && formData.phone) {
            addSupplier({ ...formData, dlDocument: "" });
            setFormData({ name: "", phone: "", category: "", gstin: "", deliveryArea: "", creditTerms: "COD" });
            setShowForm(false);
        }
    };

    const handleSkip = () => {
        markStepComplete(5);
        router.push("/onboarding/step-6");
    };

    const handleNext = () => {
        markStepComplete(5);
        router.push("/onboarding/step-6");
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <FiTruck className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Supplier Setup</h1>
                    <p className="text-[#64748b]">Add your suppliers (optional - you can add more later)</p>
                </div>
            </div>

            {state.data.suppliers.length > 0 && (
                <div className="mb-6 space-y-3">
                    {state.data.suppliers.map((supplier, idx) => (
                        <div key={idx} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                            <div className="font-medium text-[#0f172a]">{supplier.name}</div>
                            <div className="text-sm text-[#64748b]">{supplier.phone} • {supplier.creditTerms}</div>
                        </div>
                    ))}
                </div>
            )}

            {showForm ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Supplier Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Category</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Pharmaceuticals"
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#0f172a] mb-2">Credit Terms</label>
                            <select
                                value={formData.creditTerms}
                                onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                                className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                            >
                                <option value="COD">Cash on Delivery</option>
                                <option value="7 days">7 Days</option>
                                <option value="15 days">15 Days</option>
                                <option value="30 days">30 Days</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="w-full px-4 py-3 bg-[#0ea5a3] text-white rounded-lg font-medium hover:bg-[#0d9391] transition-colors"
                    >
                        Add Supplier
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-4 py-3 border-2 border-dashed border-[#cbd5e1] text-[#64748b] rounded-lg font-medium hover:border-[#0ea5a3] hover:text-[#0ea5a3] transition-colors flex items-center justify-center gap-2"
                >
                    <FiPlus className="w-5 h-5" />
                    Add Another Supplier
                </button>
            )}

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-4")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <div className="flex gap-3">
                    {state.data.suppliers.length === 0 && (
                        <button
                            onClick={handleSkip}
                            className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors"
                        >
                            Skip for Now
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                    >
                        Continue to POS
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
