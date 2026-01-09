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
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            {/* Primary Message */}
            <h2
                className={`text-3xl md:text-4xl font-bold text-white text-center mb-12 ${getAnimationClass(animationClasses.fadeInUp)}`}
            >
                You now have access to the full experience.
            </h2>

            {/* Capabilities Grid */}
            <div className="flex flex-col gap-4 max-w-md w-full">
                {PREMIUM_CAPABILITIES.map((capability, index) => (
                    <div
                        key={capability.id}
                        className={`
              p-5 rounded-xl border transition-all duration-300
              ${isPremium ? 'bg-white/10 backdrop-blur-sm border-white/20' : 'bg-white/5 border-white/10'}
              ${visibleCapabilities.includes(index) ? getAnimationClass(animationClasses.sequentialReveal) : 'opacity-0'}
            `}
                        style={{
                            opacity: visibleCapabilities.includes(index) ? 1 : 0,
                        }}
                    >
                        <p className="text-white/90 text-lg font-medium">
                            {capability.title}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
