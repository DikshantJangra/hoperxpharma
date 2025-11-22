"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { MdReceipt } from "react-icons/md";

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

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <MdReceipt className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">POS & Billing Configuration</h1>
                    <p className="text-[#64748b]">Set up your point-of-sale and billing preferences</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">Invoice Number Format</label>
                    <input
                        type="text"
                        value={formData.invoiceFormat}
                        onChange={(e) => setFormData({ ...formData, invoiceFormat: e.target.value })}
                        placeholder="INV/0001"
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-3">Payment Methods</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {["Cash", "UPI", "Card", "Wallet"].map(method => (
                            <button
                                key={method}
                                onClick={() => togglePaymentMethod(method)}
                                className={`px-4 py-3 rounded-lg font-medium transition-colors ${formData.paymentMethods.includes(method)
                                        ? "bg-[#0ea5a3] text-white"
                                        : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                                    }`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">Billing Type</label>
                        <select
                            value={formData.billingType}
                            onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        >
                            <option value="MRP-based">MRP-based</option>
                            <option value="Discount-based">Discount-based</option>
                            <option value="Manual">Manual Rate</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">Print Format</label>
                        <select
                            value={formData.printFormat}
                            onChange={(e) => setFormData({ ...formData, printFormat: e.target.value })}
                            className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                        >
                            <option value="Thermal">Thermal (80mm)</option>
                            <option value="A4">A4</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">Invoice Footer Text</label>
                    <textarea
                        value={formData.footerText}
                        onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>

                <div className="space-y-4">
                    {[
                        { key: "autoRounding", label: "Auto-rounding", description: "Automatically round invoice totals" },
                        { key: "enableGSTBilling", label: "Enable GST Billing", description: "Include GST details on invoices" }
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
                    onClick={() => router.push("/onboarding/step-5")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Users
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
