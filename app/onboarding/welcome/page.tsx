"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { FiDatabase, FiCheckCircle, FiArrowRight, FiPlayCircle, FiBriefcase } from "react-icons/fi";
import { toast } from "sonner";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/auth-store";
import { useTourStore } from "@/lib/store/tour-store";

export default function WelcomePage() {
    const { setMode } = useOnboarding();
    const { refreshUserData } = useAuthStore();
    const { setShouldAutoStart } = useTourStore();
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleModeSelect = async (mode: 'REAL' | 'DEMO') => {
        setLoading(mode);
        try {
            // 1. Set mode in backend (creates demo store if DEMO)
            const response = await setMode(mode);

            if (mode === 'DEMO') {
                toast.success("Demo store created successfully!");

                // 2. CRITICAL: Refresh auth store to detect the new store
                // This updates 'hasStore' to true, allowing access to Dashboard
                await refreshUserData();

                // 3. Set flag to auto-start tour after redirect
                setShouldAutoStart(true);

                // Wait a moment for toast
                setTimeout(() => {
                    router.push('/dashboard/overview');
                }, 1000);
            } else {
                toast.success("Let's get started with your store setup!");
                router.push('/onboarding/step-1');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to select mode. Please try again.");
            setLoading(null);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col items-center justify-center p-4 relative">
            {/* Top Left Logo */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
                <Logo size="lg" showText={true} />
            </div>

            <div className="max-w-6xl w-full mx-auto animate-in fade-in zoom-in duration-500 flex flex-col items-center">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        How would you like to explore HopeRxPharma?
                    </h1>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto hidden md:block">
                        Choose the path that suits you best. You can always set up your real store later.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full relative items-center">
                    {/* Option A: Demo Data - Secondary (Blue) */}
                    <div
                        className={`
                            relative bg-white/80 backdrop-blur rounded-2xl p-8 border hover:border-blue-500 transition-all duration-300 cursor-pointer group h-fit
                            ${loading === 'DEMO' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
                        `}
                        onClick={() => !loading && handleModeSelect('DEMO')}
                    >
                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <FiPlayCircle className="w-7 h-7 text-blue-600" />
                        </div>

                        <div className="mb-4">
                            <div className="inline-block bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide mb-2">
                                PLAYGROUND MODE
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                Explore with Demo Data
                            </h3>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Perfect for first-time users. We'll set up a temporary environment for you to play around with features using dummy data.
                        </p>

                        <div className="space-y-3 mb-8">
                            {[
                                "Preloaded Products",
                                "Sample Patients",
                                "Sample Invoices"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <FiCheckCircle className="w-4 h-4 text-blue-500/70 flex-shrink-0" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={!!loading}
                            className="w-full py-3 rounded-lg border border-blue-600 text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-all"
                        >
                            {loading === 'DEMO' ? 'Setting up...' : 'Try Demo Mode'}
                        </button>
                    </div>

                    {/* Option B: Real Data - Primary (Green) */}
                    <div
                        className={`
                            relative bg-white rounded-2xl p-10 border-2 shadow-2xl shadow-emerald-900/10 transform scale-105 z-10 
                            transition-all duration-300 cursor-pointer hover:border-emerald-600 hover:shadow-emerald-900/20 group
                            ${loading === 'REAL' ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-emerald-600'}
                        `}
                        onClick={() => !loading && handleModeSelect('REAL')}
                    >
                        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-lg shadow-sm">
                            RECOMMENDED FOR OWNERS
                        </div>

                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-105 transition-transform shadow-inner">
                            <FiBriefcase className="w-10 h-10 text-emerald-600" />
                        </div>

                        <h3 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight group-hover:text-emerald-700 transition-colors">
                            Start with My Real Data
                        </h3>

                        <p className="text-base text-gray-600 mb-8 leading-relaxed">
                            For confident pharmacy owners ready to digitize their operations.
                            Set up your actual store profile and start billing immediately.
                        </p>

                        <div className="space-y-4 mb-10">
                            {[
                                "Official Store Setup",
                                "License & GST Configuration",
                                "Link your Real Inventory",
                                "Go Live in Minutes"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-base text-gray-700 font-medium">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={!!loading}
                            className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all flex items-center justify-center gap-3 transform group-hover:translate-y-[-2px]"
                        >
                            {loading === 'REAL' ? 'Starting Setup...' : 'Start Real Onboarding'}
                            {!loading && <FiArrowRight className="text-emerald-200" />}
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-6 left-0 w-full text-center">
                    <p className="text-gray-400 text-xs">
                        Don't worry, you can always switch later or contact support if you seek help.
                    </p>
                </div>
            </div>
        </div>
    );
}
