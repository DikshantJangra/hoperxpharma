"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiArrowLeft, FiLink, FiCheckCircle } from "react-icons/fi";
import { MdWhatsapp, MdEmail } from "react-icons/md";
import OnboardingCard from "@/components/onboarding/OnboardingCard";

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

    const handleBack = () => {
        router.push("/onboarding/step-7");
    };

    return (
        <OnboardingCard
            title="Integrations"
            description="Connect your communication and payment channels (optional)"
            icon={<FiLink size={28} />}
        >
            <div className="space-y-4">
                {/* WhatsApp Integration */}
                <div className="p-5 border border-gray-200 rounded-xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group bg-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <MdWhatsapp className="w-7 h-7 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">WhatsApp Business</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Send order updates and reminders</p>
                            </div>
                        </div>
                        <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors">
                            Connect Later
                        </button>
                    </div>
                </div>

                {/* Email Integration */}
                <div className="p-5 border border-emerald-100 bg-emerald-50/30 rounded-xl transition-all duration-300">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                <MdEmail className="w-7 h-7 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Email Service</h3>
                                <p className="text-sm text-gray-500 mt-0.5">Auto-configured via Resend</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-medium text-xs">
                            <FiCheckCircle size={14} />
                            Active
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                    <p className="text-sm text-blue-700 leading-relaxed">
                        <span className="font-semibold">Note:</span> You can configure SMS providers and payment gateways later from the Integrations settings dashboard.
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
                        Continue to Data Import
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </OnboardingCard>
    );
}
