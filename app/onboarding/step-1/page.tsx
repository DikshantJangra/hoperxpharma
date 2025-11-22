"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiInfo, FiArrowRight } from "react-icons/fi";
import { MdStore } from "react-icons/md";

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const BUSINESS_TYPES = [
    "Retail Pharmacy",
    "Wholesale Pharmacy",
    "Hospital-based Pharmacy",
    "Multi-store Chain"
];

export default function Step1Page() {
    const { state, updateStoreIdentity, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        pharmacyName: state.data.storeIdentity.pharmacyName || "",
        businessType: state.data.storeIdentity.businessType || "",
        address: state.data.storeIdentity.address || "",
        city: state.data.storeIdentity.city || "",
        pinCode: state.data.storeIdentity.pinCode || "",
        state: state.data.storeIdentity.state || "",
        landmark: state.data.storeIdentity.landmark || "",
        storeLogo: state.data.storeIdentity.storeLogo || "",
        displayName: state.data.storeIdentity.displayName || ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setCurrentStep(1);
    }, [setCurrentStep]);

    // Auto-save on field change
    useEffect(() => {
        const timer = setTimeout(() => {
            updateStoreIdentity(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    // Auto-detect state from PIN code
    useEffect(() => {
        if (formData.pinCode.length === 6) {
            // Simple PIN to state mapping (first 2 digits)
            const pinPrefix = formData.pinCode.substring(0, 2);
            const stateMap: Record<string, string> = {
                "11": "Delhi",
                "12": "Haryana",
                "13": "Punjab",
                "14": "Himachal Pradesh",
                "15": "Jammu and Kashmir",
                "16": "Chandigarh",
                "17": "Punjab",
                "18": "Haryana",
                "19": "Uttar Pradesh",
                "20": "Uttar Pradesh",
                "21": "Uttar Pradesh",
                "22": "Uttar Pradesh",
                "23": "Uttar Pradesh",
                "24": "Uttar Pradesh",
                "25": "Uttar Pradesh",
                "26": "Uttarakhand",
                "27": "Uttar Pradesh",
                "28": "Uttar Pradesh",
                "30": "Rajasthan",
                "31": "Rajasthan",
                "32": "Rajasthan",
                "33": "Rajasthan",
                "34": "Rajasthan",
                "35": "Gujarat",
                "36": "Gujarat",
                "37": "Gujarat",
                "38": "Gujarat",
                "39": "Gujarat",
                "40": "Maharashtra",
                "41": "Maharashtra",
                "42": "Maharashtra",
                "43": "Maharashtra",
                "44": "Maharashtra",
                "45": "Karnataka",
                "46": "Karnataka",
                "47": "Karnataka",
                "48": "Karnataka",
                "49": "Karnataka",
                "50": "Telangana",
                "51": "Andhra Pradesh",
                "52": "Andhra Pradesh",
                "53": "Andhra Pradesh",
                "56": "Karnataka",
                "57": "Karnataka",
                "58": "Karnataka",
                "59": "Karnataka",
                "60": "Tamil Nadu",
                "61": "Tamil Nadu",
                "62": "Tamil Nadu",
                "63": "Tamil Nadu",
                "64": "Tamil Nadu",
                "67": "Kerala",
                "68": "Kerala",
                "69": "Kerala",
                "70": "West Bengal",
                "71": "West Bengal",
                "72": "West Bengal",
                "73": "West Bengal",
                "74": "West Bengal",
                "75": "West Bengal",
                "76": "Odisha",
                "77": "Odisha",
                "78": "Assam",
                "79": "Assam",
                "80": "Bihar",
                "81": "Bihar",
                "82": "Bihar",
                "83": "Bihar",
                "84": "Bihar",
                "85": "Jharkhand",
                "86": "Jharkhand",
                "87": "Madhya Pradesh",
                "88": "Chhattisgarh"
            };

            const detectedState = stateMap[pinPrefix];
            if (detectedState && !formData.state) {
                setFormData(prev => ({ ...prev, state: detectedState }));
            }
        }
    }, [formData.pinCode]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.pharmacyName || formData.pharmacyName.length < 3) {
            newErrors.pharmacyName = "Pharmacy name must be at least 3 characters";
        }

        if (!formData.businessType) {
            newErrors.businessType = "Please select a business type";
        }

        if (!formData.address || formData.address.length < 10) {
            newErrors.address = "Please provide a complete address";
        }

        if (!formData.city) {
            newErrors.city = "City is required";
        }

        if (!formData.pinCode || !/^\d{6}$/.test(formData.pinCode)) {
            newErrors.pinCode = "Please enter a valid 6-digit PIN code";
        }

        if (!formData.state) {
            newErrors.state = "State is required";
        }

        if (!formData.displayName || formData.displayName.length < 3) {
            newErrors.displayName = "Display name must be at least 3 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            updateStoreIdentity(formData);
            markStepComplete(1);
            router.push("/onboarding/step-2");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center flex-shrink-0">
                    <MdStore className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Store Identity Setup</h1>
                    <p className="text-[#64748b]">Let's start by setting up your pharmacy's basic information</p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
                {/* Pharmacy Name */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Pharmacy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.pharmacyName}
                        onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                        placeholder="e.g., Hope Medical Store"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.pharmacyName ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.pharmacyName && (
                        <p className="mt-2 text-sm text-red-600">{errors.pharmacyName}</p>
                    )}
                </div>

                {/* Business Type */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.businessType}
                        onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.businessType ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    >
                        <option value="">Select business type</option>
                        {BUSINESS_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    {errors.businessType && (
                        <p className="mt-2 text-sm text-red-600">{errors.businessType}</p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Complete Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Building number, street name, area..."
                        rows={3}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.address ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.address && (
                        <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                    )}
                </div>

                {/* City, PIN, State */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Mumbai"
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.city ? "border-red-500" : "border-[#cbd5e1]"
                                }`}
                        />
                        {errors.city && (
                            <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                            PIN Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.pinCode}
                            onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                            placeholder="400001"
                            maxLength={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.pinCode ? "border-red-500" : "border-[#cbd5e1]"
                                }`}
                        />
                        {errors.pinCode && (
                            <p className="mt-2 text-sm text-red-600">{errors.pinCode}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                            State <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.state ? "border-red-500" : "border-[#cbd5e1]"
                                }`}
                        >
                            <option value="">Select state</option>
                            {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        {errors.state && (
                            <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                        )}
                    </div>
                </div>

                {/* Landmark */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Landmark <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="Near City Hospital"
                        className="w-full px-4 py-3 border border-[#cbd5e1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3]"
                    />
                </div>

                {/* Display Name */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Store Display Name <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-[#64748b]">
                            (This will appear on invoices and receipts)
                        </span>
                    </label>
                    <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="Hope Medical Store"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.displayName ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.displayName && (
                        <p className="mt-2 text-sm text-red-600">{errors.displayName}</p>
                    )}
                </div>

                {/* Store Logo */}
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Store Logo <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-8 text-center hover:border-[#0ea5a3] transition-colors cursor-pointer">
                        <FiUpload className="w-8 h-8 text-[#64748b] mx-auto mb-3" />
                        <p className="text-sm text-[#64748b] mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-[#94a3b8]">PNG or JPG (max. 2MB)</p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <FiInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <strong>Why do we need this?</strong>
                        <p className="mt-1">This information will be used on invoices, labels, receipts, and for compliance purposes. Your state will be auto-detected from the PIN code.</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Licensing
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
