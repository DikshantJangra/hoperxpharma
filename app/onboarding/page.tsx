"use client";

import { useOnboarding } from "@/contexts/OnboardingContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const { state } = useOnboarding();
    const router = useRouter();

    useEffect(() => {
        // Redirect logic
        if (!state.mode) {
            router.push('/onboarding/welcome');
        } else if (state.mode === 'DEMO') {
            router.push('/dashboard/overview');
        } else {
            // Redirect to saved step
            router.push(`/onboarding/step-${state.currentStep}`);
        }
    }, [state.currentStep, state.mode, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#0ea5a3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#64748b]">Resuming your setup...</p>
            </div>
        </div>
    );
}
