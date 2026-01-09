'use client';

import { useEffect } from 'react';
import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses } from '@/lib/animations/welcomeAnimations';

/**
 * Section 1: Arrival
 * Purpose: Emotional grounding
 * Duration: 2.5s
 */
export function ArrivalSection({ isActive, onComplete }: WelcomeSectionProps) {
    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => {
                onComplete();
            }, 4500); // Increased duration for memory check

            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono selection:bg-emerald-500/30 relative">


            {/* Main Heading */}
            <h1
                className={`text-3xl md:text-6xl font-bold text-emerald-500 uppercase tracking-tighter mb-12 mt-10 text-center ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                HOPE_RX<span className="animate-pulse text-white">_</span>
            </h1>

            {/* System Status Indicators - Centered Below */}
            <div className="text-sm md:text-base space-y-4 text-neutral-400 mb-8 items-center flex flex-col w-full max-w-lg">
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex justify-between w-full border-b border-neutral-800 pb-2`} style={{ animationDelay: '500ms' }}>
                    <span className="flex items-center gap-2"><span className="text-emerald-500">➜</span> SECURING_YOUR_WORKSPACE</span>
                    <span className="text-emerald-500 font-bold">LOCKED</span>
                </div>
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex justify-between w-full border-b border-neutral-800 pb-2`} style={{ animationDelay: '1200ms' }}>
                    <span className="flex items-center gap-2"><span className="text-emerald-500">➜</span> LINKING_YOUR_PRIVATE_CLOUD</span>
                    <span className="text-emerald-500 font-bold">CONNECTED</span>
                </div>
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex justify-between w-full border-b border-neutral-800 pb-2`} style={{ animationDelay: '2000ms' }}>
                    <span className="flex items-center gap-2"><span className="text-emerald-500">➜</span> VERIFYING_LICENSE_KEY</span>
                    <span className="text-emerald-500 font-bold">VALID</span>
                </div>
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex justify-between w-full pt-2 opacity-50`} style={{ animationDelay: '2800ms' }}>
                    <span className="flex items-center gap-2 text-white">➜ INITIALIZING_DASHBOARD...</span>
                    <span className="animate-spin text-white">/</span>
                </div>
            </div>

            {/* Privacy Reassurance */}
            <div
                className={`absolute bottom-8 text-neutral-600 text-[10px] md:text-xs tracking-wider uppercase ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '3500ms' }}
            >
                Your data is isolated. Your operations are private.
            </div>

            <div
                className={`absolute bottom-12 flex items-center gap-2 text-neutral-600 text-[10px] tracking-widest ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '3500ms' }}
            >
                KERNEL_VERSION: v2.4.0-stable
            </div>
        </div>
    );
}
