"use client";

import { useEffect, useRef, useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiUpload, FiDownload, FiDatabase, FiFileText } from "react-icons/fi";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import { onboardingApi } from "@/lib/api/onboarding";
import toast from "react-hot-toast";

export default function Step9Page() {
    const { state, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importingType, setImportingType] = useState<string | null>(null);

    useEffect(() => {
        setCurrentStep(9);
    }, [setCurrentStep]);

    const handleNext = () => {
        markStepComplete(9);
        router.push("/onboarding/step-10");
    };

    const handleBack = () => {
        router.push("/onboarding/step-8");
    };

    const handleDownloadTemplate = async (type: string) => {
        try {
            const blob = await onboardingApi.getImportTemplate(type.toUpperCase());
            // Create blob url
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type.toLowerCase()}_template.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success(`${type} template downloaded`);
        } catch (error) {
            console.error('Template download error:', error);
            toast.error('Failed to download template');
        }
    };

    const handleUploadClick = (type: string) => {
        setImportingType(type);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !importingType) return;

        const type = importingType.toUpperCase();
        const loadingToast = toast.loading(`Importing ${importingType}...`);

        try {
            const response = await onboardingApi.importData(type, file);
            toast.dismiss(loadingToast);

            const result = response.data || response; // Handle different response wrappers if any

            if (result.count > 0) {
                toast.success(`Successfully imported ${result.count} records`);
            } else if (result.count === 0 && (!result.errors || result.errors.length === 0)) {
                toast.success('Import processed but no records were added');
            }

            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors);
                toast((t) => (
                    <div>
                        <p className="font-semibold text-amber-600">Import Completed with Issues</p>
                        <p className="text-sm text-gray-600">{result.errors.length} records succeeded, {result.errors.length} failed.</p>
                        <p className="text-xs text-gray-500 mt-1">Check console for details.</p>
                    </div>
                ), { duration: 5000 });
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            console.error('Import error:', error);
            toast.error(error.message || `Failed to import ${importingType}`);
        } finally {
            setImportingType(null);
        }
    };

    return (
        <OnboardingCard
            title="Data Import"
            description="Import your existing data (optional - you can do this later)"
            icon={<FiDatabase size={28} />}
        >
            <div className="space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                />

                {[
                    { title: "Inventory", description: "Import your product catalog", icon: <FiFileText size={20} /> },
                    { title: "Patients", description: "Import patient records", icon: <FiFileText size={20} /> },
                    { title: "Suppliers", description: "Import supplier information", icon: <FiFileText size={20} /> },
                    { title: "Sales", description: "Import past transactions", icon: <FiFileText size={20} /> }
                ].map((item) => (
                    <div key={item.title} className="p-5 border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownloadTemplate(item.title)}
                                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg font-medium text-xs hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                            >
                                <FiDownload className="w-3.5 h-3.5" />
                                Template
                            </button>
                        </div>
                        <div
                            onClick={() => handleUploadClick(item.title)}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/10 transition-all cursor-pointer group/upload"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 mx-auto mb-2 flex items-center justify-center group-hover/upload:bg-emerald-100 group-hover/upload:text-emerald-500 transition-colors">
                                <FiUpload className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-medium text-gray-600 group-hover/upload:text-emerald-600 transition-colors">Click to upload CSV file</p>
                            <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
                        </div>
                    </div>
                ))}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
                    <p className="text-sm text-amber-700 leading-relaxed">
                        <span className="font-semibold">Tip:</span> Download the templates first to see the required format. You can import data anytime from the Settings menu.
                    </p>
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
                        Continue to Review
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
