"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { MdWhatsapp, MdEmail } from "react-icons/md";

export default function Step8Page() {
    const { state, setCurrentStep, markStepComplete } = useOnboarding();
    const router = useRouter();

    useEffect(() => {
        setCurrentStep(8);
    }, [setCurrentStep]);

    const handleNext = () => {
        markStepComplete(8);
        router.push("/onboarding/step-9");
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8 mb-20">
            <div className="flex items-start gap-4 mb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0ea5a3] to-[#0d9391] flex items-center justify-center">
                    <MdWhatsapp className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Integrations</h1>
                    <p className="text-[#64748b]">Connect your communication and payment channels (optional)</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-6 border border-[#e2e8f0] rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <MdWhatsapp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#0f172a]">WhatsApp Business</h3>
                                <p className="text-sm text-[#64748b]">Send order updates and reminders</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 border border-[#cbd5e1] text-[#475569] rounded-lg font-medium hover:bg-[#f8fafc] transition-colors">
                            Connect Later
                        </button>
                    </div>
                </div>

                <div className="p-6 border border-[#e2e8f0] rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <MdEmail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#0f172a]">Email Service</h3>
                                <p className="text-sm text-[#64748b]">Auto-configured via Resend</p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
                            Auto-configured
                        </span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                        <strong>Note:</strong> You can configure SMS providers and payment gateways later from the Integrations settings.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex justify-between">
                <button
                    onClick={() => router.push("/onboarding/step-7")}
                    className="px-8 py-3 border border-[#cbd5e1] text-[#475569] rounded-lg font-semibold hover:bg-[#f8fafc] transition-colors flex items-center gap-2"
                >
                    <FiArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-[#0ea5a3] text-white rounded-lg font-semibold hover:bg-[#0d9391] transition-colors flex items-center gap-2"
                >
                    Continue to Data Import
                    <FiArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
