'use client';

import { useEffect, useState } from 'react';
import type { WelcomeSectionProps } from '@/lib/types/welcome.types';
import { PREMIUM_CAPABILITIES } from '@/lib/types/welcome.types';
import { getAnimationClass, animationClasses, sleep } from '@/lib/animations/welcomeAnimations';

/**
 * Section 3: Capability
 * Purpose: Affirm value without selling
 * Duration: 4s (progressive reveal)
 */
export function CapabilitySection({ isActive, onComplete, isPremium }: WelcomeSectionProps) {
    const [visibleCapabilities, setVisibleCapabilities] = useState<number[]>([]);

    useEffect(() => {
        if (isActive) {
            // Progressive reveal of capabilities
            const revealSequence = async () => {
                // Show message first
                await sleep(400);

                // Reveal each capability sequentially
                for (let i = 0; i < PREMIUM_CAPABILITIES.length; i++) {
                    await sleep(800);
                    setVisibleCapabilities(prev => [...prev, i]);
                }

                // Wait a bit after last capability
                await sleep(1200);
                onComplete();
            };

            revealSequence();
        }
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-neutral-950 font-mono">
            {/* Primary Message */}
            <h2
                className={`text-sm text-emerald-500 uppercase tracking-widest mb-12 ${getAnimationClass(animationClasses.fadeInUp)}`}
            >
                Loading_Modules...
            </h2>

            {/* Capabilities Grid */}
            <div className="flex flex-col gap-2 max-w-md w-full">
                {PREMIUM_CAPABILITIES.map((capability, index) => (
                    <div
                        key={capability.id}
                        className={`
              flex items-center gap-3 p-3 border-l-2 transition-all duration-300
              ${visibleCapabilities.includes(index) ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-800 bg-transparent'}
              ${visibleCapabilities.includes(index) ? getAnimationClass(animationClasses.sequentialReveal) : 'opacity-0'}
            `}
                        style={{
                            opacity: visibleCapabilities.includes(index) ? 1 : 0,
                        }}
                    >
                        <span className={`text-xs ${visibleCapabilities.includes(index) ? 'text-emerald-500' : 'text-neutral-600'}`}>
                            {visibleCapabilities.includes(index) ? '[OK]' : '[..]'}
                        </span>
                        <p className="text-white/90 text-sm md:text-base font-medium tracking-wide">
                            {capability.title}
                        </p>
                    </div>
                ))}
            </div>

            <div className="h-8 mt-4 flex items-center">
                {visibleCapabilities.length === PREMIUM_CAPABILITIES.length && (
                    <span className={`text-neutral-500 text-xs ${getAnimationClass(animationClasses.fadeIn)}`}>
                        ALL_SYSTEMS_OPERATIONAL
                    </span>
                )}
            </div>
        </div>
    );
}
