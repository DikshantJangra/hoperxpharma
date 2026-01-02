"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiPrinter, FiCreditCard, FiSettings, FiFileText, FiCheck, FiDollarSign, FiSmartphone } from "react-icons/fi";
import { MdReceipt, MdAccountBalanceWallet } from "react-icons/md";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step6Page() {
    const { state, updatePOS, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        invoiceFormat: state.data.pos?.invoiceFormat || "INV-{YY}{MM}-{SEQ:4}",
        paymentMethods: state.data.pos?.paymentMethods?.length ? state.data.pos.paymentMethods : ["Cash", "UPI", "Card", "Wallet"],
        billingType: state.data.pos?.billingType || "MRP-based",
        printFormat: state.data.pos?.printFormat || "Thermal",
        footerText: state.data.pos?.footerText || "Thank you for your business!", // Keep for backward compatibility/other uses
        autoRounding: state.data.pos?.autoRounding !== undefined ? state.data.pos.autoRounding : true,
        defaultCustomerType: state.data.pos?.defaultCustomerType || "Walk-in",
        enableGSTBilling: state.data.pos?.enableGSTBilling !== undefined ? state.data.pos.enableGSTBilling : true,
        upiId: state.data.pos?.upiId || ""
    });

    useEffect(() => {
        setCurrentStep(6);
    }, [setCurrentStep]);

    // Sync with context when data loads
    useEffect(() => {
        if (state.data.pos) {
            setFormData(prev => {
                const next = {
                    ...prev,
                    invoiceFormat: state.data.pos?.invoiceFormat || prev.invoiceFormat,
                    paymentMethods: state.data.pos?.paymentMethods?.length ? state.data.pos.paymentMethods : prev.paymentMethods,
                    billingType: state.data.pos?.billingType || prev.billingType,
                    printFormat: state.data.pos?.printFormat || prev.printFormat,
                    footerText: state.data.pos?.footerText || prev.footerText,
                    autoRounding: state.data.pos?.autoRounding !== undefined ? state.data.pos.autoRounding : prev.autoRounding,
                    defaultCustomerType: state.data.pos?.defaultCustomerType || prev.defaultCustomerType,
                    enableGSTBilling: state.data.pos?.enableGSTBilling !== undefined ? state.data.pos.enableGSTBilling : prev.enableGSTBilling,
                    upiId: state.data.pos?.upiId || prev.upiId
                };

                if (JSON.stringify(prev) === JSON.stringify(next)) {
                    return prev;
                }
                return next;
            });
        }
    }, [state.data.pos]);

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
                        <div className="relative">
                            <div className="absolute left-4 top-3.5 text-gray-400">
                                <FiFileText size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.invoiceFormat}
                                onChange={(e) => setFormData({ ...formData, invoiceFormat: e.target.value })}
                                placeholder="INV-{YY}{MM}-{SEQ:4}"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 font-mono mb-2"
                            />

                            {/* Live Preview & Insight */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3 pl-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Preview:</span>
                                    <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
                                        {formData.invoiceFormat
                                            .replace('{YYYY}', new Date().getFullYear().toString())
                                            .replace('{YY}', new Date().getFullYear().toString().slice(-2))
                                            .replace('{MM}', String(new Date().getMonth() + 1).padStart(2, '0'))
                                            .replace('{DD}', String(new Date().getDate()).padStart(2, '0'))
                                            .replace('{SEQ:4}', '0001')
                                            .replace(/{SEQ:(\d+)}/, (_, width) => '0'.repeat(parseInt(width) - 1) + '1')
                                        }
                                    </span>
                                </div>

                                {/* Capacity Insight */}
                                {(() => {
                                    const match = formData.invoiceFormat.match(/{SEQ:(\d+)}/);
                                    if (match) {
                                        const digits = parseInt(match[1]);
                                        const capacity = Math.pow(10, digits) - 1;
                                        const formattedCapacity = new Intl.NumberFormat('en-IN').format(capacity);

                                        let cycle = 'total';
                                        if (formData.invoiceFormat.includes('{DD}')) cycle = 'day';
                                        else if (formData.invoiceFormat.includes('{MM}')) cycle = 'month';
                                        else if (formData.invoiceFormat.includes('{YYYY}') || formData.invoiceFormat.includes('{YY}')) cycle = 'year';

                                        return (
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                Supports <span className="font-semibold text-gray-700">{formattedCapacity}</span> invoices per {cycle}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* Token Helpers */}
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { token: '{YYYY}', desc: 'Year (2025)' },
                                    { token: '{YY}', desc: 'Year (25)' },
                                    { token: '{MM}', desc: 'Month (01-12)' },
                                    { token: '{DD}', desc: 'Day (01-31)' },
                                    { token: '{SEQ:4}', desc: 'Sequence (0001)' }
                                ].map((item) => (
                                    <button
                                        key={item.token}
                                        onClick={() => setFormData(prev => ({ ...prev, invoiceFormat: prev.invoiceFormat + item.token }))}
                                        className="px-2 py-1 bg-white hover:bg-gray-50 text-[10px] text-gray-600 rounded-lg border border-gray-200 hover:border-gray-300 transition-all font-mono shadow-sm flex items-center gap-1 group"
                                        title={`Add ${item.desc}`}
                                    >
                                        <span className="font-semibold text-emerald-600 group-hover:text-emerald-700">+</span>
                                        {item.token}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Billing Type <span className="text-gray-400 font-normal ml-1">(Default: Standard)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.billingType}
                                onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none"
                            >
                                <option value="MRP-based">Standard (MRP)</option>
                                <option value="Discount-based">Discount on MRP</option>
                                <option value="Manual">Manual Rate</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Billing Type Description */}
                        <div className="mt-2 ml-1 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[11px] text-gray-500 leading-relaxed">
                                {formData.billingType === "MRP-based" && (
                                    <>
                                        <span className="block font-semibold text-emerald-600 mb-0.5">Standard Billing</span>
                                        Items are sold at their MRP. You can still apply manual discounts on individual items.
                                        <span className="block mt-1 font-medium text-gray-400">Example: MRP ₹100 → Bill ₹100</span>
                                    </>
                                )}
                                {formData.billingType === "Discount-based" && (
                                    <>
                                        <span className="block font-semibold text-emerald-600 mb-0.5">Discount Billing</span>
                                        Automatically applies a store-wide discount percentage on the MRP for all items.
                                        <span className="block mt-1 font-medium text-gray-400">Example: MRP ₹100 (10% Off) → Bill ₹90</span>
                                    </>
                                )}
                                {formData.billingType === "Manual" && (
                                    <>
                                        <span className="block font-semibold text-emerald-600 mb-0.5">Manual Rate</span>
                                        Requires the cashier to manually enter the sale price for every item (Open Pricing).
                                        <span className="block mt-1 font-medium text-gray-400">Example: MRP ₹100 → Bill ₹[Enter Price]</span>
                                    </>
                                )}
                            </p>
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
                                        {method === "Cash" && <FiDollarSign size={20} className={isSelected ? "text-white" : "text-emerald-500"} />}
                                        {method === "UPI" && <FiSmartphone size={20} className={isSelected ? "text-white" : "text-emerald-500"} />}
                                        {method === "Card" && <FiCreditCard size={20} className={isSelected ? "text-white" : "text-emerald-500"} />}
                                        {method === "Wallet" && <MdAccountBalanceWallet size={20} className={isSelected ? "text-white" : "text-emerald-500"} />}
                                        {method}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Text & UPI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Invoice Footer Text
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <FiFileText size={18} />
                            </div>
                            <input
                                type="text"
                                value={formData.footerText}
                                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                                placeholder="Thank you for your business!"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900"
                            />
                        </div>
                    </div>

                    {formData.paymentMethods.includes('UPI') && (
                        <div className="group">
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1 flex justify-between">
                                <span>UPI ID (for QR Code)</span>
                                {formData.upiId && (
                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId)
                                        ? "text-emerald-500"
                                        : "text-red-400"
                                        }`}>
                                        {/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId) ? "Valid Format" : "Invalid Format"}
                                    </span>
                                )}
                            </label>
                            <div className="relative flex gap-2">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <FiSmartphone size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                    placeholder="merchant@upi"
                                    className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:bg-white transition-all text-sm text-gray-900 ${formData.upiId && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId)
                                        ? "border-emerald-200 focus:border-emerald-500"
                                        : formData.upiId
                                            ? "border-red-200 focus:border-red-500"
                                            : "border-gray-200 focus:border-emerald-500"
                                        }`}
                                />
                                {formData.upiId && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(formData.upiId) ? (
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <FiCheck size={12} />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                                <span className="text-xs font-bold">!</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
