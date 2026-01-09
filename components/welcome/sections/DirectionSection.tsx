'use client';

import { useEffect } from 'react';
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
    // Keyboard listener for Enter/Space
    useEffect(() => {
        if (isActive) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    onComplete();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-emerald-600 font-mono selection:bg-white/30">
            {/* Primary Heading */}
            <h1
                className={`text-3xl md:text-6xl font-bold text-white uppercase tracking-tight mb-8 text-center drop-shadow-md ${getAnimationClass(animationClasses.fadeInUp)}`}
                style={{ animationDelay: '200ms' }}
            >
                YOUR_WORKSPACE_IS_NOW_ACTIVE<span className="animate-pulse">_</span>
            </h1>

            <div
                className={`text-emerald-100 text-sm md:text-lg text-center max-w-2xl leading-relaxed mb-16 font-medium ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '600ms' }}
            >
                <p className="mb-4">
                    Your workspace is now fully active and ready for daily operations.
                </p>
                <p className="text-white font-bold tracking-wide">
                    This system improves the more you use it.
                </p>
            </div>

            {/* CTA Button - White on Emerald */}
            <button
                onClick={onComplete}
                className={`
          group relative px-12 py-6 bg-white text-emerald-700 font-bold text-base tracking-[0.2em] uppercase
          hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 shadow-xl
          ${getAnimationClass(animationClasses.fadeInUp)}
        `}
                style={{ animationDelay: '1000ms' }}
            >
                {/* Button Decorative Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-emerald-600" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-emerald-600" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-emerald-600" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-emerald-600" />

                <span className="relative z-10 flex items-center gap-4">
                    <span className="animate-pulse">&gt;</span> BEGIN_OPERATIONS
                </span>
            </button>

            {/* Optional skip hint */}
            <p
                className={`text-emerald-200/60 text-xs mt-12 animate-pulse font-medium tracking-widest ${getAnimationClass(animationClasses.fadeIn)}`}
                style={{ animationDelay: '1500ms' }}
            >
                [ENTER] OR [SPACE] TO LAUNCH
            </p>
        </div>
    );
}
