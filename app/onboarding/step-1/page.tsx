"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiInfo, FiArrowRight, FiHome, FiMapPin, FiType, FiImage, FiPhone } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

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
        displayName: state.data.storeIdentity.displayName || "",
        phoneNumber: state.data.storeIdentity.phoneNumber || ""
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
                "11": "Delhi", "12": "Haryana", "13": "Punjab", "14": "Himachal Pradesh", "15": "Jammu and Kashmir",
                "16": "Chandigarh", "17": "Punjab", "18": "Haryana", "19": "Uttar Pradesh", "20": "Uttar Pradesh",
                "21": "Uttar Pradesh", "22": "Uttar Pradesh", "23": "Uttar Pradesh", "24": "Uttar Pradesh", "25": "Uttar Pradesh",
                "26": "Uttarakhand", "27": "Uttar Pradesh", "28": "Uttar Pradesh", "30": "Rajasthan", "31": "Rajasthan",
                "32": "Rajasthan", "33": "Rajasthan", "34": "Rajasthan", "35": "Gujarat", "36": "Gujarat",
                "37": "Gujarat", "38": "Gujarat", "39": "Gujarat", "40": "Maharashtra", "41": "Maharashtra",
                "42": "Maharashtra", "43": "Maharashtra", "44": "Maharashtra", "45": "Karnataka", "46": "Karnataka",
                "47": "Karnataka", "48": "Karnataka", "49": "Karnataka", "50": "Telangana", "51": "Andhra Pradesh",
                "52": "Andhra Pradesh", "53": "Andhra Pradesh", "56": "Karnataka", "57": "Karnataka", "58": "Karnataka",
                "59": "Karnataka", "60": "Tamil Nadu", "61": "Tamil Nadu", "62": "Tamil Nadu", "63": "Tamil Nadu",
                "64": "Tamil Nadu", "67": "Kerala", "68": "Kerala", "69": "Kerala", "70": "West Bengal",
                "71": "West Bengal", "72": "West Bengal", "73": "West Bengal", "74": "West Bengal", "75": "West Bengal",
                "76": "Odisha", "77": "Odisha", "78": "Assam", "79": "Assam", "80": "Bihar", "81": "Bihar",
                "82": "Bihar", "83": "Bihar", "84": "Bihar", "85": "Jharkhand", "86": "Jharkhand", "87": "Madhya Pradesh",
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

        if (!formData.phoneNumber) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (formData.phoneNumber.length !== 10) {
            newErrors.phoneNumber = "Phone number must be exactly 10 digits";
        } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Phone number must start with 6, 7, 8, or 9";
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
        <OnboardingCard
            title="Store Identity Setup"
            description="Let's start by setting up your pharmacy's basic information"
            icon={<FiHome size={28} />}
        >
            <div className="space-y-6">
                {/* Pharmacy Name */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Pharmacy Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiHome size={18} />
                        </div>
                        <input
                            type="text"
                            value={formData.pharmacyName}
                            onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.pharmacyName ? "border-red-500" : "border-gray-200"}`}
                            placeholder="e.g., Hope Medical Store"
                        />
                    </div>
                    {errors.pharmacyName && <p className="mt-1 ml-1 text-xs text-red-500">{errors.pharmacyName}</p>}
                </div>

                {/* Business Type */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Business Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiType size={18} />
                        </div>
                        <select
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none ${errors.businessType ? "border-red-500" : "border-gray-200"}`}
                        >
                            <option value="">Select business type</option>
                            {BUSINESS_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    {errors.businessType && <p className="mt-1 ml-1 text-xs text-red-500">{errors.businessType}</p>}
                </div>

                {/* Phone Number */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Phone Number <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            ({formData.phoneNumber.length}/10 digits)
                        </span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiPhone size={18} />
                        </div>
                        <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm border-r border-gray-200 pr-2">
                            +91
                        </div>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                setFormData({ ...formData, phoneNumber: val });
                            }}
                            placeholder="9876543210"
                            maxLength={10}
                            className={`w-full pl-24 pr-16 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.phoneNumber ? "border-red-500" : formData.phoneNumber.length === 10 ? "border-emerald-500" : "border-gray-200"}`}
                        />
                        {formData.phoneNumber.length === 10 && !errors.phoneNumber && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {errors.phoneNumber && <p className="mt-1 ml-1 text-xs text-red-500">{errors.phoneNumber}</p>}
                    {!errors.phoneNumber && formData.phoneNumber.length > 0 && formData.phoneNumber.length < 10 && (
                        <p className="mt-1 ml-1 text-xs text-amber-600">Enter {10 - formData.phoneNumber.length} more digit{10 - formData.phoneNumber.length !== 1 ? 's' : ''}</p>
                    )}
                </div>

                {/* Address */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Complete Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiMapPin size={18} />
                        </div>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Building number, street name, area..."
                            rows={3}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.address ? "border-red-500" : "border-gray-200"}`}
                        />
                    </div>
                    {errors.address && <p className="mt-1 ml-1 text-xs text-red-500">{errors.address}</p>}
                </div>

                {/* City, PIN, State */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            City <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            placeholder="Mumbai"
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.city ? "border-red-500" : "border-gray-200"}`}
                        />
                        {errors.city && <p className="mt-1 ml-1 text-xs text-red-500">{errors.city}</p>}
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            PIN Code <span className="text-red-500">*</span>
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                ({formData.pinCode.length}/6 digits)
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.pinCode}
                                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                                placeholder="400001"
                                maxLength={6}
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.pinCode ? "border-red-500" : formData.pinCode.length === 6 ? "border-emerald-500" : "border-gray-200"}`}
                            />
                            {formData.pinCode.length === 6 && !errors.pinCode && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {errors.pinCode && <p className="mt-1 ml-1 text-xs text-red-500">{errors.pinCode}</p>}
                        {!errors.pinCode && formData.pinCode.length > 0 && formData.pinCode.length < 6 && (
                            <p className="mt-1 ml-1 text-xs text-amber-600">Enter {6 - formData.pinCode.length} more digit{6 - formData.pinCode.length !== 1 ? 's' : ''}</p>
                        )}
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            State <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 appearance-none ${errors.state ? "border-red-500" : "border-gray-200"}`}
                            >
                                <option value="">Select state</option>
                                {INDIAN_STATES.map((state) => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        {errors.state && <p className="mt-1 ml-1 text-xs text-red-500">{errors.state}</p>}
                    </div>
                </div>

                {/* Landmark */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Landmark <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        placeholder="Near City Hospital"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400"
                    />
                </div>

                {/* Display Name */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Store Display Name <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            (This will appear on invoices and receipts)
                        </span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiType size={18} />
                        </div>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Hope Medical Store"
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.displayName ? "border-red-500" : "border-gray-200"}`}
                        />
                    </div>
                    {errors.displayName && <p className="mt-1 ml-1 text-xs text-red-500">{errors.displayName}</p>}
                </div>

                {/* Store Logo */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Store Logo <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group-hover:border-emerald-400">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-emerald-500 transition-colors">
                            <FiImage size={24} />
                        </div>
                        <p className="text-sm text-gray-600 font-medium mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG or JPG (max. 2MB)</p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <FiInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                        <strong className="font-semibold">Why do we need this?</strong>
                        <p className="mt-1 text-blue-600/80 leading-relaxed">This information will be used on invoices, labels, receipts, and for compliance purposes. Your state will be auto-detected from the PIN code.</p>
                    </div>
                </div>

                {/* Navigation */}
                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleNext}
                        className="px-8 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                    >
                        Continue to Licensing
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
