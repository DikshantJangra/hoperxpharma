'use client';

import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses } from '@/lib/animations/welcomeAnimations';

/**
 * Section 4: Direction
 * Purpose: Clear next step, user-controlled
 * Duration: Until user clicks
 */
export function DirectionSection({
    isActive,
    onComplete,
    isPremium
}: WelcomeSectionProps) {
    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono">
            {/* Primary Message */}
            <h2
                className={`text-4xl md:text-5xl font-bold text-white text-center mb-4 tracking-tighter ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                System Ready.
            </h2>

            <p
                className={`text-emerald-500 text-sm uppercase tracking-widest mb-12 ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '400ms' }}
            >
                Workspace Initialized Successfully
            </p>

            {/* CTA Button */}
            <button
                onClick={onComplete}
                className={`
          group relative px-8 py-3 bg-white text-black font-bold text-sm tracking-wider uppercase
          hover:bg-emerald-400 transition-colors duration-300
          ${getAnimationClass(animationClasses.fadeInUp)}
        `}
                style={{ animationDelay: '600ms' }}
            >
                <span className="relative z-10 flex items-center gap-2">
                    Enter Dashboard <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
            </button>

            {/* Optional skip hint */}
            <p
                className={`text-neutral-600 text-xs mt-12 animate-pulse ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '100ms' }}
            >
                PRESS_ANY_KEY_OR_CLICK_TO_START
            </p>
        </div>
    );
}
