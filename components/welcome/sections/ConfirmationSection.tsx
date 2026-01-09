'use client';

import { useEffect } from 'react';
import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses } from '@/lib/animations/welcomeAnimations';

/**
 * Section 2: Confirmation
 * Purpose: Remove doubt, state facts
 * Duration: 2.5s
 */
export function ConfirmationSection({
    isActive,
    onComplete,
    subscriptionData
}: WelcomeSectionProps) {
    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => {
                onComplete();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    const planDisplay = subscriptionData?.planName || 'Premium';
    const billingCycle = subscriptionData?.billingCycle === 'yearly' ? 'ANNUAL' : 'MONTHLY';
    const timestamp = new Date().toISOString().split('T')[0];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono">
            {/* Status Header */}
            <div
                className={`text-emerald-500 text-sm mb-6 uppercase tracking-widest ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '100ms' }}
            >
                Transaction Confirmed
            </div>

            {/* Data Block */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 md:p-8 rounded-lg max-w-md w-full relative overflow-hidden group">
                {/* Decorative scanning line */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 animate-scan" />

                <div className="space-y-4 text-sm md:text-base">
                    <div
                        className={`flex justify-between items-center border-b border-neutral-800 pb-2 ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '300ms' }}
                    >
                        <span className="text-neutral-500">STATUS</span>
                        <span className="text-white font-bold tracking-wider">ACTIVE</span>
                    </div>

                    <div
                        className={`flex justify-between items-center border-b border-neutral-800 pb-2 ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '500ms' }}
                    >
                        <span className="text-neutral-500">PLAN_TYPE</span>
                        <span className="text-emerald-400">{planDisplay.toUpperCase()}</span>
                    </div>

                    <div
                        className={`flex justify-between items-center border-b border-neutral-800 pb-2 ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '700ms' }}
                    >
                        <span className="text-neutral-500">BILLING</span>
                        <span className="text-white">{billingCycle}</span>
                    </div>

                    <div
                        className={`flex justify-between items-center ${getAnimationClass(animationClasses.fadeInUp)}`}
                        style={{ animationDelay: '900ms' }}
                    >
                        <span className="text-neutral-500">DATE</span>
                        <span className="text-white">{timestamp}</span>
                    </div>
                </div>
            </div>

            <div
                className={`mt-8 text-neutral-600 text-xs ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '1200ms' }}
            >
                ID: {subscriptionData?.id}
            </div>
        </div>
    );
}
