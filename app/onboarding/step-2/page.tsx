"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiInfo, FiArrowRight, FiArrowLeft, FiShield, FiCalendar, FiFileText } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

export default function Step2Page() {
    const { state, updateLicensing, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    const [formData, setFormData] = useState({
        dlNumber: state.data.licensing.dlNumber || "",
        dlValidityStart: state.data.licensing.dlValidityStart || "",
        dlValidityEnd: state.data.licensing.dlValidityEnd || "",
        gstin: state.data.licensing.gstin || "",
        pan: state.data.licensing.pan || "",
        dlDocument: state.data.licensing.dlDocument || "",
        gstCertificate: state.data.licensing.gstCertificate || ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setCurrentStep(2);
    }, [setCurrentStep]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateLicensing(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    const validateGSTIN = (gstin: string) => {
        if (gstin.length !== 15) return false;
        // Basic GSTIN format: 2 digits (state) + 10 chars (PAN) + 1 char (entity) + 1 char (Z) + 1 check digit
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstinRegex.test(gstin);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.dlNumber || formData.dlNumber.length < 5) {
            newErrors.dlNumber = "Please enter a valid Drug License number";
        }

        if (!formData.dlValidityStart) {
            newErrors.dlValidityStart = "Start date is required";
        }

        if (!formData.dlValidityEnd) {
            newErrors.dlValidityEnd = "End date is required";
        }

        if (formData.dlValidityStart && formData.dlValidityEnd) {
            if (new Date(formData.dlValidityEnd) <= new Date(formData.dlValidityStart)) {
                newErrors.dlValidityEnd = "End date must be after start date";
            }
            if (new Date(formData.dlValidityEnd) <= new Date()) {
                newErrors.dlValidityEnd = "License must be valid (not expired)";
            }
        }

        if (!formData.gstin) {
            newErrors.gstin = "GSTIN is required";
        } else if (!validateGSTIN(formData.gstin)) {
            newErrors.gstin = "Please enter a valid 15-character GSTIN";
        }

        if (formData.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
            newErrors.pan = "Please enter a valid PAN (e.g., ABCDE1234F)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validate()) {
            updateLicensing(formData);
            markStepComplete(2);
            router.push("/onboarding/step-3");
        }
    };

    const handleBack = () => {
        updateLicensing(formData);
        router.push("/onboarding/step-1");
    };

    return (
        <OnboardingCard
            title="Licensing & Compliance"
            description="Ensure legal compliance with regulatory requirements"
            icon={<FiShield size={28} />}
        >
            <div className="space-y-6">
                {/* Drug License Number */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        Drug License Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiShield size={18} />
                        </div>
                        <input
                            type="text"
                            value={formData.dlNumber}
                            onChange={(e) => setFormData({ ...formData, dlNumber: e.target.value.toUpperCase() })}
                            placeholder="DL-MH-12345"
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.dlNumber ? "border-red-500" : "border-gray-200"}`}
                        />
                    </div>
                    {errors.dlNumber && <p className="mt-1 ml-1 text-xs text-red-500">{errors.dlNumber}</p>}
                </div>

                {/* DL Validity Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            DL Validity Start Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <FiCalendar size={18} />
                            </div>
                            <input
                                type="date"
                                value={formData.dlValidityStart}
                                onChange={(e) => setFormData({ ...formData, dlValidityStart: e.target.value })}
                                className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.dlValidityStart ? "border-red-500" : "border-gray-200"}`}
                            />
                        </div>
                        {errors.dlValidityStart && <p className="mt-1 ml-1 text-xs text-red-500">{errors.dlValidityStart}</p>}
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            DL Validity End Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                <FiCalendar size={18} />
                            </div>
                            <input
                                type="date"
                                value={formData.dlValidityEnd}
                                onChange={(e) => setFormData({ ...formData, dlValidityEnd: e.target.value })}
                                className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.dlValidityEnd ? "border-red-500" : "border-gray-200"}`}
                            />
                        </div>
                        {errors.dlValidityEnd && <p className="mt-1 ml-1 text-xs text-red-500">{errors.dlValidityEnd}</p>}
                    </div>
                </div>

                {/* GSTIN */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        GSTIN <span className="text-red-500">*</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiFileText size={18} />
                        </div>
                        <input
                            type="text"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase().slice(0, 15) })}
                            placeholder="27AABCU9603R1ZM"
                            maxLength={15}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.gstin ? "border-red-500" : "border-gray-200"}`}
                        />
                    </div>
                    {errors.gstin && <p className="mt-1 ml-1 text-xs text-red-500">{errors.gstin}</p>}
                    <p className="mt-1.5 ml-1 text-xs text-gray-400">15-character GST Identification Number</p>
                </div>

                {/* PAN */}
                <div className="group">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                        PAN <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                            <FiFileText size={18} />
                        </div>
                        <input
                            type="text"
                            value={formData.pan}
                            onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 ${errors.pan ? "border-red-500" : "border-gray-200"}`}
                        />
                    </div>
                    {errors.pan && <p className="mt-1 ml-1 text-xs text-red-500">{errors.pan}</p>}
                </div>

                {/* Document Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Upload Drug License <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group-hover:border-emerald-400 ${errors.dlDocument ? "border-red-500" : "border-gray-200"}`}>
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-emerald-500 transition-colors">
                                <FiUpload size={20} />
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Upload DL Document</p>
                            <p className="text-[10px] text-gray-400">PDF or JPG (max. 5MB)</p>
                        </div>
                        {errors.dlDocument && <p className="mt-1 ml-1 text-xs text-red-500">{errors.dlDocument}</p>}
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Upload GST Certificate <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer group-hover:border-emerald-400">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-emerald-500 transition-colors">
                                <FiUpload size={20} />
                            </div>
                            <p className="text-xs text-gray-600 font-medium mb-1">Upload GST Certificate</p>
                            <p className="text-[10px] text-gray-400">PDF or JPG (max. 5MB)</p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-3">
                    <FiInfo className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <strong className="font-semibold">Important:</strong>
                        <p className="mt-1 text-amber-600/80 leading-relaxed">We'll set up automatic expiry reminders 30 days before your Drug License expires. All documents are encrypted and stored securely.</p>
                    </div>
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
                        Continue to Timings
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
