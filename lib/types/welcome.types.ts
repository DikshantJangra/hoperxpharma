/**
 * Premium Post-Payment Welcome Experience Types
 * Backend-truth-driven, one-time affirmation system
 */

// ============================================================================
// Welcome State Types
// ============================================================================

export interface WelcomeState {
    /** Whether welcome should be shown */
    shouldShow: boolean;

    /** Whether welcome is currently active */
    isActive: boolean;

    /** Current section being displayed */
    currentSection: WelcomeSection | null;

    /** Subscription data for display */
    subscriptionData: SubscriptionData | null;

    /** Error if welcome check failed */
    error?: string;
}

export type WelcomeSection =
    | 'arrival'
    | 'confirmation'
    | 'capability'
    | 'direction';

export interface SubscriptionData {
    id: string;
    planName: string;
    status: string;
    activatedAt: string;
    billingCycle: 'monthly' | 'yearly';
}

// ============================================================================
// Eligibility Types
// ============================================================================

export interface WelcomeEligibility {
    /** Is subscription active */
    isActive: boolean;

    /** Has welcome been shown before */
    wasShown: boolean;

    /** Is payment verified */
    isVerified: boolean;

    /** Final eligibility result */
    eligible: boolean;
}

// ============================================================================
// Capability Display
// ============================================================================

export interface SubscriptionCapability {
    id: string;
    title: string;
    order: number;
}

export const PREMIUM_CAPABILITIES: SubscriptionCapability[] = [
    {
        id: 'workspace',
        title: 'Customize your workspace',
        order: 1,
    },
    {
        id: 'insights',
        title: 'Access detailed insights',
        order: 2,
    },
    {
        id: 'efficiency',
        title: 'Move faster with fewer steps',
        order: 3,
    },
];

// ============================================================================
// Component Props
// ============================================================================

export interface PremiumWelcomeProps {
    /** Subscription data for display */
    subscriptionData: SubscriptionData;

    /** Callback when welcome completes */
    onComplete: () => void;

    /** Callback when user skips */
    onSkip?: () => void;
}

export interface WelcomeSectionProps {
    /** Whether section is currently active */
    isActive: boolean;

    /** Callback when section animation completes */
    onComplete: () => void;

    /** Subscription data for display */
    subscriptionData?: SubscriptionData;

    /** Premium styling flag */
    isPremium?: boolean;
}

// ============================================================================
// Animation Config
// ============================================================================

export interface WelcomeAnimationConfig {
    /** Section display duration in ms */
    duration: number;

    /** Easing function */
    easing: string;

    /** Delay before next section */
    transitionDelay: number;
}

export const WELCOME_SECTION_TIMING: Record<WelcomeSection, number> = {
    arrival: 2500,
    confirmation: 2500,
    capability: 4000,
    direction: 0, // User controlled
};
