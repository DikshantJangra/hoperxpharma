"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiUpload, FiDownload } from "react-icons/fi";

export default function Step9Page() {
    const { state, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    useEffect(() => {
        setCurrentStep(9);
    }, [setCurrentStep]);

    const handleNext = () => {
        markStepComplete(9);
        router.push("/onboarding/step-10");
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <FiUpload className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Data Import</h1>
                    <p className="text-[#64748b]">Import your existing data (optional - you can do this later)</p>
                </div>
            </div>

            <div className="space-y-4">
                {[
                    { title: "Inventory", description: "Import your product catalog" },
                    { title: "Patients", description: "Import patient records" },
                    { title: "Suppliers", description: "Import supplier information" },
                    { title: "Sales History", description: "Import past transactions" }
                ].map((item) => (
                    <div key={item.title} className="p-6 border border-[#e2e8f0] rounded-xl">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-[#0f172a] mb-1">{item.title}</h3>
                                <p className="text-sm text-[#64748b]">{item.description}</p>
                            </div>
                            <button className="px-4 py-2 border border-[#cbd5e1] text-[#64748b] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
                                <FiDownload className="w-4 h-4" />
                                Template
                            </button>
                        </div>
                        <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-6 text-center hover:border-[#0ea5a3] transition-colors cursor-pointer">
                            <FiUpload className="w-6 h-6 text-[#64748b] mx-auto mb-2" />
                            <p className="text-sm text-[#64748b]">Click to upload CSV or Excel file</p>
                        </div>
                    </div>
                ))}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700">
                        <strong>Tip:</strong> Download the templates first to see the required format. You can import data anytime from the Settings menu.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-8")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Review
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
