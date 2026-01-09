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
    const billingCycle = subscriptionData?.billingCycle === 'yearly' ? 'Annual' : 'Monthly';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            {/* Primary Message */}
            <h2
                className={`text-3xl md:text-4xl font-bold text-white text-center mb-6 ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                Your payment has been confirmed.
            </h2>

            {/* Subtle Divider */}
            <div
                className={`w-16 h-px bg-white/20 mb-6 ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '400ms' }}
            />

            {/* Plan Information */}
            <p
                className={`text-lg md:text-xl text-white/80 text-center max-w-lg ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '600ms' }}
            >
                Your account is now upgraded to <span className="text-white font-medium">{planDisplay}</span>.
            </p>

            <p
                className={`text-base text-white/60 text-center mt-2 ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '800ms' }}
            >
                {billingCycle} billing
            </p>
        </div>
    );
}
