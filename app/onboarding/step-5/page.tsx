"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiTruck, FiPlus, FiUser, FiPhone, FiTag, FiFileText, FiEdit2, FiTrash2 } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step5Page() {
    const { state, addSupplier, removeSupplier, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [showForm, setShowForm] = useState(state.data.suppliers.length === 0);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        category: "",
        gstin: "",
        deliveryArea: "",
        creditTerms: "COD"
    });
    const [phoneError, setPhoneError] = useState("");

    const validatePhone = (phone: string) => {
        if (!phone) return "";
        if (!/^\d{10}$/.test(phone)) {
            return "Phone number must be exactly 10 digits";
        }
        return "";
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, phone: cleaned });
        setPhoneError(validatePhone(cleaned));
    };

    useEffect(() => {
        setCurrentStep(5);
    }, [setCurrentStep]);

    const handleAdd = () => {
        const phoneValidation = validatePhone(formData.phone);
        if (phoneValidation) {
            setPhoneError(phoneValidation);
            return;
        }
        
        if (formData.name && formData.phone) {
            if (editIndex !== null) {
                removeSupplier(editIndex);
                addSupplier({ ...formData, dlDocument: "" });
                setEditIndex(null);
            } else {
                addSupplier({ ...formData, dlDocument: "" });
            }
            setFormData({ name: "", phone: "", category: "", gstin: "", deliveryArea: "", creditTerms: "COD" });
            setPhoneError("");
            setShowForm(false);
        }
    };

    const handleEdit = (index: number) => {
        const supplier = state.data.suppliers[index];
        setFormData({
            name: supplier.name,
            phone: supplier.phone,
            category: supplier.category || "",
            gstin: supplier.gstin || "",
            deliveryArea: supplier.deliveryArea || "",
            creditTerms: supplier.creditTerms || "COD"
        });
        setPhoneError("");
        setEditIndex(index);
        setShowForm(true);
    };

    const handleDelete = (index: number) => {
        if (confirm('Are you sure you want to remove this supplier?')) {
            removeSupplier(index);
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

    const handleBack = () => {
        router.push("/onboarding/step-4");
    };

    return (
        <OnboardingCard
            title="Supplier Setup"
            description="Add your suppliers (optional - you can add more later)"
            icon={<FiTruck size={28} />}
        >
            <div className="space-y-6">
                {/* Supplier List */}
                {state.data.suppliers.length > 0 && (
                    <div className="space-y-3 animate-fade-in-up">
                        {state.data.suppliers.map((supplier, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-emerald-200 transition-colors">
                                <div>
                                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                                        <FiUser className="text-emerald-500" size={16} />
                                        {supplier.name}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                        <span className="flex items-center gap-1"><FiPhone size={12} /> {supplier.phone}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span className="flex items-center gap-1"><FiFileText size={12} /> {supplier.creditTerms}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(idx)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Supplier Form */}
                {showForm ? (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 animate-fade-in-up">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Supplier Name <span className="text-red-500">*</span></label>
                                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                            <FiUser size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                            placeholder="Enter supplier name"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Phone <span className="text-red-500">*</span></label>
                                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                            <FiPhone size={18} />
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handlePhoneChange(e.target.value)}
                                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:outline-none transition-all text-sm text-gray-900 ${
                                                phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
                                            }`}
                                            placeholder="Enter 10-digit phone number"
                                            maxLength={10}
                                        />
                                    </div>
                                    {phoneError && (
                                        <p className="text-xs text-red-500 mt-1 ml-1">{phoneError}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Category</label>
                                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                            <FiTag size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="Pharmaceuticals"
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">Credit Terms</label>
                                    <div className="relative">
                                        <select
                                            value={formData.creditTerms}
                                            onChange={(e) => setFormData({ ...formData, creditTerms: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm text-gray-900 appearance-none"
                                        >
                                            <option value="COD">Cash on Delivery</option>
                                            <option value="7 days">7 Days</option>
                                            <option value="15 days">15 Days</option>
                                            <option value="30 days">30 Days</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    disabled={!formData.name || !formData.phone || !!phoneError}
                                    className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                                >
                                    {editIndex !== null ? 'Update Supplier' : 'Add Supplier'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full px-4 py-4 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl font-medium hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/10 transition-all flex items-center justify-center gap-2 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors">
                            <FiPlus size={18} />
                        </div>
                        Add Another Supplier
                    </button>
                )}

                {/* Navigation */}
                <div className="pt-4 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex gap-3">
                        {state.data.suppliers.length === 0 && !showForm && (
                            <button
                                onClick={handleSkip}
                                className="px-6 py-3 text-gray-500 font-medium hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Skip for Now
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                            Continue to Staff
                            <FiArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </OnboardingCard>
    );
}
