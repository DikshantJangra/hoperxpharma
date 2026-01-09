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
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            {/* Primary Message */}
            <h2
                className={`text-3xl md:text-4xl font-bold text-white text-center mb-8 ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                You can begin right away.
            </h2>

            {/* CTA Button */}
            <button
                onClick={onComplete}
                className={`
          px-8 py-4 rounded-xl font-semibold text-lg
          transition-all duration-300
          ${isPremium
                        ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                        : 'bg-white text-emerald-600 hover:bg-gray-50'
                    }
          ${getAnimationClass(animationClasses.fadeInUp)}
        `}
                style={{ animationDelay: '400ms' }}
            >
                Continue to Dashboard
            </button>

            {/* Optional skip hint */}
            <p
                className={`text-white/40 text-sm mt-8 ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '800ms' }}
            >
                Click anywhere to continue
            </p>
        </div>
    );
}
