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
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            {/* Primary Message */}
            <h1
                className={`text-4xl md:text-5xl font-bold text-white text-center mb-4 ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                Welcome.
            </h1>

            <p
                className={`text-xl md:text-2xl text-white/90 text-center max-w-2xl ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '400ms' }}
            >
                Your subscription is now active.
            </p>
        </div>
    );
}
