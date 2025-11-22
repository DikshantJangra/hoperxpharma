"use client";

import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";

function OnboardingLayoutContent({ children }: { children: React.ReactNode }) {
    const { state } = useOnboarding();
    const router = useRouter();

    const steps = [
        { number: 1, title: "Store Identity", path: "/onboarding/step-1" },
        { number: 2, title: "Licensing", path: "/onboarding/step-2" },
        { number: 3, title: "Timings", path: "/onboarding/step-3" },
        { number: 4, title: "Inventory", path: "/onboarding/step-4" },
        { number: 5, title: "Suppliers", path: "/onboarding/step-5" },
        { number: 6, title: "POS & Billing", path: "/onboarding/step-6" },
        { number: 7, title: "Users & Roles", path: "/onboarding/step-7" },
        { number: 8, title: "Integrations", path: "/onboarding/step-8" },
        { number: 9, title: "Data Import", path: "/onboarding/step-9" },
        { number: 10, title: "Review", path: "/onboarding/step-10" }
    ];

    const progress = (state.currentStep / 10) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f0fdfa] to-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-[#0ea5a3]">HopeRx</div>
                            <div className="h-8 w-px bg-[#e2e8f0]"></div>
                            <div className="text-sm text-[#64748b]">Setup Wizard</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-[#64748b]">
                                Step {state.currentStep} of 10
                            </span>
                            <div className="w-32 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#0ea5a3] to-[#0d9391] transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white border-b border-[#e2e8f0]">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, idx) => (
                            <div key={step.number} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={() => {
                                            if (state.completedSteps.includes(step.number) || step.number <= state.currentStep) {
                                                router.push(step.path);
                                            }
                                        }}
                                        disabled={step.number > state.currentStep && !state.completedSteps.includes(step.number)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${state.completedSteps.includes(step.number)
                                            ? "bg-[#0ea5a3] text-white"
                                            : step.number === state.currentStep
                                                ? "bg-[#0ea5a3] text-white ring-4 ring-[#0ea5a3] ring-opacity-20"
                                                : step.number < state.currentStep
                                                    ? "bg-[#e2e8f0] text-[#64748b]"
                                                    : "bg-white border-2 border-[#e2e8f0] text-[#cbd5e1]"
                                            }`}
                                    >
                                        {state.completedSteps.includes(step.number) ? (
                                            <FiCheck className="w-5 h-5" />
                                        ) : (
                                            step.number
                                        )}
                                    </button>
                                    <span className={`mt-2 text-xs font-medium ${step.number === state.currentStep
                                        ? "text-[#0ea5a3]"
                                        : state.completedSteps.includes(step.number)
                                            ? "text-[#0f172a]"
                                            : "text-[#cbd5e1]"
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className={`w-12 h-0.5 mx-2 ${state.completedSteps.includes(step.number) ? "bg-[#0ea5a3]" : "bg-[#e2e8f0]"
                                        }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {children}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2e8f0] py-4">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between text-sm text-[#64748b]">
                        <div>
                            Need help? <a href="/help/chat" className="text-[#0ea5a3] hover:underline">Contact Support</a>
                        </div>
                        <div>
                            Auto-saving your progress...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    return (
        <OnboardingProvider>
            <OnboardingLayoutContent>{children}</OnboardingLayoutContent>
        </OnboardingProvider>
    );
}
