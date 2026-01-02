"use client";

import { useState, useEffect, useRef } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiUpload, FiInfo, FiArrowRight, FiArrowLeft, FiShield, FiCalendar, FiFileText, FiCheck, FiX, FiLoader } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { onboardingApi } from "@/lib/api/onboarding";
import toast from "react-hot-toast";

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

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
    const [dlUploadStatus, setDlUploadStatus] = useState<UploadStatus>('idle');
    const [gstUploadStatus, setGstUploadStatus] = useState<UploadStatus>('idle');

    const dlInputRef = useRef<HTMLInputElement>(null);
    const gstInputRef = useRef<HTMLInputElement>(null);

    // Enable enhanced keyboard navigation
    const { handleKeyDown } = useKeyboardNavigation();

    useEffect(() => {
        setCurrentStep(2);
    }, [setCurrentStep]);

    // Sync formData when context licensing data loads asynchronously
    useEffect(() => {
        const licensing = state.data.licensing;
        if (licensing.dlDocument || licensing.gstCertificate || licensing.dlNumber) {
            setFormData(prev => {
                const next = {
                    ...prev,
                    dlNumber: licensing.dlNumber || prev.dlNumber,
                    dlValidityStart: licensing.dlValidityStart || prev.dlValidityStart,
                    dlValidityEnd: licensing.dlValidityEnd || prev.dlValidityEnd,
                    gstin: licensing.gstin || prev.gstin,
                    pan: licensing.pan || prev.pan,
                    dlDocument: licensing.dlDocument || prev.dlDocument,
                    gstCertificate: licensing.gstCertificate || prev.gstCertificate
                };

                if (JSON.stringify(prev) === JSON.stringify(next)) {
                    return prev;
                }
                return next;
            });

            // Set upload status to success if URLs already exist
            if (licensing.dlDocument) setDlUploadStatus('success');
            if (licensing.gstCertificate) setGstUploadStatus('success');
        }
    }, [state.data.licensing]);

    useEffect(() => {
        const timer = setTimeout(() => {
            updateLicensing(formData);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData]);

    const validateGSTIN = (gstin: string) => {
        if (gstin.length !== 15) return false;
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

    const handleFileUpload = async (
        file: File,
        licenseType: 'DRUG_LICENSE' | 'GST_CERTIFICATE',
        setStatus: (status: UploadStatus) => void
    ) => {
        try {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                return;
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only JPEG, PNG, WebP, and PDF files are allowed');
                return;
            }

            setStatus('uploading');

            // 1. Request presigned URL
            const uploadResponse = await onboardingApi.requestLicenseUpload(licenseType, file.name);
            const uploadData = uploadResponse.data || uploadResponse; // Handle both wrapped and direct response

            // 2. Upload to presigned URL
            await fetch(uploadData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            setStatus('processing');

            // 3. Process the upload (compression, validation, etc.)
            const processResponse = await onboardingApi.processLicenseUpload(uploadData.tempKey, licenseType);
            const processedData = processResponse.data || processResponse;

            // 4. Update form state with the processed URL
            if (licenseType === 'DRUG_LICENSE') {
                setFormData(prev => ({ ...prev, dlDocument: processedData.url }));
            } else {
                setFormData(prev => ({ ...prev, gstCertificate: processedData.url }));
            }

            setStatus('success');
            toast.success(`${licenseType === 'DRUG_LICENSE' ? 'Drug License' : 'GST Certificate'} uploaded successfully!`);
        } catch (error: any) {
            console.error('Upload error:', error);
            setStatus('error');
            toast.error(error.message || 'Failed to upload document');
        }
    };

    const handleDlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'DRUG_LICENSE', setDlUploadStatus);
        }
    };

    const handleGstFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file, 'GST_CERTIFICATE', setGstUploadStatus);
        }
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

    const renderUploadBox = (
        title: string,
        description: string,
        status: UploadStatus,
        onClick: () => void,
        uploadedUrl: string | null
    ) => {
        const getStatusIcon = () => {
            switch (status) {
                case 'uploading':
                case 'processing':
                    return <FiLoader className="animate-spin" size={20} />;
                case 'success':
                    return <FiCheck size={20} />;
                case 'error':
                    return <FiX size={20} />;
                default:
                    return <FiUpload size={20} />;
            }
        };

        const getStatusColor = () => {
            switch (status) {
                case 'success':
                    return 'border-emerald-500 bg-emerald-50';
                case 'error':
                    return 'border-red-500 bg-red-50';
                case 'uploading':
                case 'processing':
                    return 'border-blue-500 bg-blue-50';
                default:
                    return 'border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30';
            }
        };

        const getStatusText = () => {
            switch (status) {
                case 'uploading':
                    return 'Uploading...';
                case 'processing':
                    return 'Optimizing...';
                case 'success':
                    return 'Uploaded!';
                case 'error':
                    return 'Failed - Click to retry';
                default:
                    return description;
            }
        };

        return (
            <div
                onClick={onClick}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${getStatusColor()}`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${status === 'success' ? 'bg-emerald-100 text-emerald-500' : status === 'error' ? 'bg-red-100 text-red-500' : 'bg-gray-50 text-gray-400 group-hover:text-emerald-500'
                    }`}>
                    {getStatusIcon()}
                </div>
                <p className="text-xs text-gray-600 font-medium mb-1">{title}</p>
                <p className="text-[10px] text-gray-400">{getStatusText()}</p>
                {uploadedUrl && status === 'success' && (
                    <p className="text-[10px] text-emerald-600 mt-2 truncate max-w-[150px] mx-auto">
                        ✓ Document saved
                    </p>
                )}
            </div>
        );
    };

    return (
        <OnboardingCard
            title="Licensing & Compliance"
            description="Ensure legal compliance with regulatory requirements"
            icon={<FiShield size={28} />}
        >
            <div
                className="space-y-6"
                onKeyDown={handleKeyDown}
            >
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
                        <span className="ml-2 text-xs font-normal text-gray-400">
                            ({formData.gstin.length}/15 characters)
                        </span>
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
                            className={`w-full pl-11 pr-16 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm text-gray-900 placeholder:text-gray-400 font-mono ${errors.gstin ? "border-red-500" : formData.gstin.length === 15 ? "border-emerald-500" : "border-gray-200"}`}
                        />
                        {formData.gstin.length === 15 && !errors.gstin && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    {errors.gstin && <p className="mt-1 ml-1 text-xs text-red-500">{errors.gstin}</p>}
                    {!errors.gstin && formData.gstin.length > 0 && formData.gstin.length < 15 && (
                        <p className="mt-1 ml-1 text-xs text-amber-600">Enter {15 - formData.gstin.length} more character{15 - formData.gstin.length !== 1 ? 's' : ''}</p>
                    )}
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
                        <input
                            type="file"
                            ref={dlInputRef}
                            onChange={handleDlFileChange}
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                        />
                        {renderUploadBox(
                            'Upload DL Document',
                            'PDF or JPG (max. 10MB)',
                            dlUploadStatus,
                            () => dlInputRef.current?.click(),
                            formData.dlDocument
                        )}
                    </div>

                    <div className="group">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 ml-1">
                            Upload GST Certificate <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="file"
                            ref={gstInputRef}
                            onChange={handleGstFileChange}
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                        />
                        {renderUploadBox(
                            'Upload GST Certificate',
                            'PDF or JPG (max. 10MB)',
                            gstUploadStatus,
                            () => gstInputRef.current?.click(),
                            formData.gstCertificate
                        )}
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
