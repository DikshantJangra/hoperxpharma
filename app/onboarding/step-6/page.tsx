"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiPrinter, FiCreditCard, FiSettings, FiFileText, FiCheck } from "react-icons/fi";
import { MdReceipt } from "react-icons/md";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step6Page() {
    const { state, updatePOS, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        invoiceFormat: state.data.pos?.invoiceFormat || "INV/0001",
        paymentMethods: state.data.pos?.paymentMethods || ["Cash"],
        billingType: state.data.pos?.billingType || "MRP-based",
        printFormat: state.data.pos?.printFormat || "Thermal",
        footerText: state.data.pos?.footerText || "Thank you for your business!",
        autoRounding: state.data.pos?.autoRounding !== undefined ? state.data.pos.autoRounding : true,
        defaultCustomerType: state.data.pos?.defaultCustomerType || "Walk-in",
        enableGSTBilling: state.data.pos?.enableGSTBilling !== undefined ? state.data.pos.enableGSTBilling : true
    });

    useEffect(() => {
        setCurrentStep(6);
    }, [setCurrentStep]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updatePOS(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    const togglePaymentMethod = (method: string) => {
        setFormData(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.includes(method)
                ? prev.paymentMethods.filter(m => m !== method)
                : [...prev.paymentMethods, method]
        }));
    };

    const handleNext = () => {
        updatePOS(formData);
        markStepComplete(6);
        router.push("/onboarding/step-7");
    };

    const handleBack = () => {
        updatePOS(formData);
        router.push("/onboarding/step-5");
    };

    return (
        <OnboardingCard
            title="POS & Billing Configuration"
            description="Set up your point-of-sale and billing preferences"
            icon={<MdReceipt size={28} />}
        >
            <div className="space-y-8">
                {/* Invoice Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Invoice Number Format
                        </label>
                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <FiFileText size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.invoiceFormat}
                                onChange={(e) => setFormData({ ...formData, invoiceFormat: e.target.value })}
                                placeholder="INV/0001"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Billing Type
                        </label>
                        <div className="relative">
                            <select
                                value={formData.billingType}
                                onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none"
                            >
                                <option value="MRP-based">MRP-based</option>
                                <option value="Discount-based">Discount-based</option>
                                <option value="Manual">Manual Rate</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-3 ml-1">
                        Payment Methods
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["Cash", "UPI", "Card", "Wallet"].map(method => {
                            const isSelected = formData.paymentMethods.includes(method);
                            return (
                                <button
                                    key={method}
                                    onClick={() => togglePaymentMethod(method)}
                                    className={`relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 border ${isSelected
                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 transform -translate-y-0.5"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <FiCheck size={12} />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center gap-2">
                                        {method === "Cash" && <span className="text-lg">💵</span>}
                                        {method === "UPI" && <span className="text-lg">📱</span>}
                                        {method === "Card" && <span className="text-lg">💳</span>}
                                        {method === "Wallet" && <span className="text-lg">👛</span>}
                                        {method}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Print & Footer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Print Format
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <FiPrinter size={18} />
                            </div>
                            <select
                                value={formData.printFormat}
                                onChange={(e) => setFormData({ ...formData, printFormat: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none"
                            >
                                <option value="Thermal">Thermal (80mm)</option>
                                <option value="A4">A4</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Invoice Footer Text
                        </label>
                        <textarea
                            value={formData.footerText}
                            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                            rows={1}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 resize-none"
                        />
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                    {[
                        { key: "autoRounding", label: "Auto-rounding", description: "Automatically round invoice totals" },
                        { key: "enableGSTBilling", label: "Enable GST Billing", description: "Include GST details on invoices" }
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
                        Continue to Users
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
