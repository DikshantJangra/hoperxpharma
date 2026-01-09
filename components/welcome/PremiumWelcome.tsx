'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePremiumTheme } from '@/lib/hooks/usePremiumTheme';
import type { PremiumWelcomeProps, WelcomeSection } from '@/lib/types/welcome.types';
import { injectWelcomeAnimations } from '@/lib/animations/welcomeAnimations';

import { ArrivalSection } from './sections/ArrivalSection';
import { ConfirmationSection } from './sections/ConfirmationSection';
import { CapabilitySection } from './sections/CapabilitySection';
import { DirectionSection } from './sections/DirectionSection';

/**
 * Premium Post-Payment Welcome Experience
 * 
 * A state-driven, backend-truth-aligned, one-time affirmation experience
 * that builds trust and certainty after payment.
 * 
 * This is not onboarding. This is affirmation.
 */
export function PremiumWelcome({
    subscriptionData,
    onComplete,
    onSkip,
}: PremiumWelcomeProps) {
    const { isPremium } = usePremiumTheme();
    const [currentSection, setCurrentSection] = useState<WelcomeSection>('arrival');

    // Inject animations on mount
    useEffect(() => {
        injectWelcomeAnimations();
    }, []);

    // Section progression
    const handleSectionComplete = useCallback(() => {
        switch (currentSection) {
            case 'arrival':
                setCurrentSection('confirmation');
                break;
            case 'confirmation':
                setCurrentSection('capability');
                break;
            case 'capability':
                setCurrentSection('direction');
                break;
            case 'direction':
                // Final section - complete welcome
                onComplete();
                break;
        }
    }, [currentSection, onComplete]);

    // Allow clicking background to skip (in direction section only)
    const handleBackgroundClick = useCallback(() => {
        if (currentSection === 'direction' && onSkip) {
            onSkip();
        }
    }, [currentSection, onSkip]);

    return (
        <div
            className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-700 to-emerald-600 overflow-hidden"
            onClick={handleBackgroundClick}
        >
            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-800/20 to-transparent pointer-events-none" />

            {/* Content */}
            <div onClick={(e) => e.stopPropagation()}>
                <ArrivalSection
                    isActive={currentSection === 'arrival'}
                    onComplete={handleSectionComplete}
                />

                <ConfirmationSection isActive={currentSection === 'confirmation'}
                    onComplete={handleSectionComplete}
                    subscriptionData={subscriptionData}
                />

                <CapabilitySection
                    isActive={currentSection === 'capability'}
                    onComplete={handleSectionComplete}
                    isPremium={isPremium}
                />

                <DirectionSection
                    isActive={currentSection === 'direction'}
                    onComplete={handleSectionComplete}
                    isPremium={isPremium}
                />
            </div>
        </div>
    );
}
