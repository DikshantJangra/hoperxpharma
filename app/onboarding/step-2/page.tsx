"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiInfo, FiArrowRight, FiArrowLeft, FiShield } from "react-icons/fi";

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

        // Document upload is optional
        // if (!formData.dlDocument) {
        //     newErrors.dlDocument = "Drug License document is required";
        // }

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
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center flex-shrink-0">
                    <FiShield className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Licensing & Compliance</h1>
                    <p className="text-[#64748b]">Ensure legal compliance with regulatory requirements</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Drug License Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.dlNumber}
                        onChange={(e) => setFormData({ ...formData, dlNumber: e.target.value.toUpperCase() })}
                        placeholder="DL-MH-12345"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.dlNumber ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.dlNumber && <p className="mt-2 text-sm text-red-600">{errors.dlNumber}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                            DL Validity Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.dlValidityStart}
                            onChange={(e) => setFormData({ ...formData, dlValidityStart: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.dlValidityStart ? "border-red-500" : "border-[#cbd5e1]"
                                }`}
                        />
                        {errors.dlValidityStart && <p className="mt-2 text-sm text-red-600">{errors.dlValidityStart}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                            DL Validity End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={formData.dlValidityEnd}
                            onChange={(e) => setFormData({ ...formData, dlValidityEnd: e.target.value })}
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.dlValidityEnd ? "border-red-500" : "border-[#cbd5e1]"
                                }`}
                        />
                        {errors.dlValidityEnd && <p className="mt-2 text-sm text-red-600">{errors.dlValidityEnd}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        GSTIN <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase().slice(0, 15) })}
                        placeholder="27AABCU9603R1ZM"
                        maxLength={15}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.gstin ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.gstin && <p className="mt-2 text-sm text-red-600">{errors.gstin}</p>}
                    <p className="mt-2 text-xs text-[#64748b]">15-character GST Identification Number</p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        PAN <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ea5a3] ${errors.pan ? "border-red-500" : "border-[#cbd5e1]"
                            }`}
                    />
                    {errors.pan && <p className="mt-2 text-sm text-red-600">{errors.pan}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Upload Drug License Document <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-8 text-center hover:border-[#0ea5a3] transition-colors cursor-pointer ${errors.dlDocument ? "border-red-500" : "border-[#cbd5e1]"
                        }`}>
                        <FiUpload className="w-8 h-8 text-[#64748b] mx-auto mb-3" />
                        <p className="text-sm text-[#64748b] mb-1">Click to upload DL document</p>
                        <p className="text-xs text-[#94a3b8]">PDF or JPG (max. 5MB)</p>
                    </div>
                    {errors.dlDocument && <p className="mt-2 text-sm text-red-600">{errors.dlDocument}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                        Upload GST Certificate <span className="text-[#64748b] text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-8 text-center hover:border-[#0ea5a3] transition-colors cursor-pointer">
                        <FiUpload className="w-8 h-8 text-[#64748b] mx-auto mb-3" />
                        <p className="text-sm text-[#64748b] mb-1">Click to upload GST certificate</p>
                        <p className="text-xs text-[#94a3b8]">PDF or JPG (max. 5MB)</p>
                    </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                    <FiInfo className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                        <strong>Important:</strong> We'll set up automatic expiry reminders 30 days before your Drug License expires. All documents are encrypted and stored securely.
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={handleBack}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Timings
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
