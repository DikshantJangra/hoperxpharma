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
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950">
            {/* System Status Indicators */}
            <div className="font-mono text-sm md:text-base space-y-2 text-neutral-400 mb-8 items-start flex flex-col">
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex items-center gap-2`} style={{ animationDelay: '100ms' }}>
                    <span className="text-emerald-500">➜</span> SYSTEM_INIT... <span className="text-emerald-500">OK</span>
                </div>
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex items-center gap-2`} style={{ animationDelay: '600ms' }}>
                    <span className="text-emerald-500">➜</span> VERIFYING_PAYMENT... <span className="text-emerald-500">OK</span>
                </div>
                <div className={`${getAnimationClass(animationClasses.fadeIn)} flex items-center gap-2`} style={{ animationDelay: '1200ms' }}>
                    <span className="text-emerald-500">➜</span> ESTABLISHING_SECURE_CONNECTION... <span className="text-emerald-500">OK</span>
                </div>
            </div>

            {/* Primary Message */}
            <h1
                className={`text-3xl md:text-5xl font-bold text-white tracking-tight mb-2 ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '1800ms' }}
            >
                Welcome to <span className="text-emerald-500">HopeRx</span>
            </h1>

            <div
                className={`flex items-center gap-2 text-neutral-500 text-sm font-mono mt-4 ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '2200ms' }}
            >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                SYSTEM_READY
            </div>
        </div>
    );
}
