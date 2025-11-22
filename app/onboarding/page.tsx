"use client";

import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to step 1
        router.push("/onboarding/step-1");
    }, [router]);

    return (
        <OnboardingProvider>
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#0ea5a3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#64748b]">Redirecting to setup...</p>
                </div>
            </div>
        </OnboardingProvider>
    );
}
