"use client";

import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FiCheck } from "react-icons/fi";
import Logo from "@/components/ui/Logo";

function OnboardingLayoutContent({ children }: { children: React.ReactNode }) {
    const { state, isSaving, lastSaved } = useOnboarding();
    const router = useRouter();

    const steps = [
        { number: 1, title: "Identity", path: "/onboarding/step-1" },
        { number: 2, title: "Licensing", path: "/onboarding/step-2" },
        { number: 3, title: "Timings", path: "/onboarding/step-3" },
        { number: 4, title: "Inventory", path: "/onboarding/step-4" },
        { number: 5, title: "Suppliers", path: "/onboarding/step-5" },
        { number: 6, title: "Billing", path: "/onboarding/step-6" },
        { number: 7, title: "Users", path: "/onboarding/step-7" },
        { number: 8, title: "Integrations", path: "/onboarding/step-8" },
        { number: 9, title: "Import", path: "/onboarding/step-9" },
        { number: 10, title: "Review", path: "/onboarding/step-10" }
    ];

    const progress = (state.currentStep / 10) * 100;

    const pathname = usePathname();
    const isFullScreenPage = pathname === '/onboarding/welcome' || pathname === '/onboarding/business-type';

    if (isFullScreenPage) {
        return (
            <div className="min-h-screen bg-gray-50 relative font-sans">
                {/* Premium Mesh Background */}
                <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                    <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-emerald-500/3 blur-3xl"></div>
                </div>

                <div className="relative z-10 w-full h-full">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-x-hidden font-sans">
            {/* Premium Mesh Background */}
            <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-3xl"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[30%] rounded-full bg-emerald-500/3 blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Logo size="lg" showText={true} />
                        <div className="hidden md:block h-6 w-px bg-gray-200"></div>
                        <span className="hidden md:block text-sm font-medium text-gray-500 tracking-wide uppercase">Setup Wizard</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-0.5">Step {state.currentStep} of 10</p>
                            <p className="text-xs text-gray-400 font-medium">
                                {steps.find(s => s.number === state.currentStep)?.title || "Onboarding"}
                            </p>
                        </div>
                        <div className="w-32 md:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Wrapper */}
            <div className="relative z-10 pt-24 pb-24 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Desktop Stepper */}
                    <div className="hidden lg:flex items-center justify-between mb-12 px-4">
                        {steps.map((step, idx) => {
                            const isCompleted = state.completedSteps.includes(step.number);
                            const isCurrent = step.number === state.currentStep;
                            const isUpcoming = !isCompleted && !isCurrent;

                            return (
                                <div key={step.number} className="flex flex-col items-center relative group">
                                    <button
                                        onClick={() => {
                                            if (isCompleted || step.number <= state.currentStep) {
                                                router.push(step.path);
                                            }
                                        }}
                                        disabled={isUpcoming}
                                        className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative z-10
                                            ${isCompleted
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-100"
                                                : isCurrent
                                                    ? "bg-white text-emerald-600 border-2 border-emerald-500 shadow-md scale-110"
                                                    : "bg-white text-gray-300 border-2 border-gray-100"
                                            }
                                        `}
                                    >
                                        {isCompleted ? <FiCheck size={14} /> : step.number}
                                    </button>

                                    <span className={`
                                        absolute -bottom-6 text-[10px] font-semibold tracking-wide whitespace-nowrap transition-colors duration-300
                                        ${isCurrent ? "text-emerald-600" : isCompleted ? "text-gray-600" : "text-gray-300"}
                                    `}>
                                        {step.title}
                                    </span>

                                    {/* Connector Line */}
                                    {idx < steps.length - 1 && (
                                        <div className="absolute top-4 left-1/2 w-[calc(100%_-_2rem)] h-[2px] -translate-y-1/2 pointer-events-none" style={{ left: '50%', width: 'calc(100% * 3)' }}>
                                            {/* Note: The width calculation here is tricky in flex-between. 
                                                Ideally, we'd use a grid or absolute positioning for perfect lines. 
                                                For now, relying on flex gap visual. 
                                                Actually, let's simplify: just show dots for cleanliness or use a different layout.
                                                Let's keep it simple and clean without lines for now to avoid layout breakage, 
                                                or just use a simple background line behind everything.
                                            */}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Background Line for Stepper */}
                        <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-100 -z-0 hidden"></div>
                    </div>

                    {/* Content */}
                    <div className="transition-all duration-500 ease-in-out">
                        {children}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 py-4 z-40">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-4">
                        <span>© 2024 HopeRxPharma</span>
                        <span className="hidden sm:inline">•</span>
                        <Link href="/privacy-policy" target="_blank" className="hidden sm:inline hover:text-emerald-500 transition-colors">Privacy Policy</Link>
                        <span className="hidden sm:inline">•</span>
                        <Link href="/terms-of-service" target="_blank" className="hidden sm:inline hover:text-emerald-500 transition-colors">Terms of Service</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-500'}`}></div>
                        <span className="text-gray-500 font-medium">
                            {isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Auto-saving enabled'}
                        </span>
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
