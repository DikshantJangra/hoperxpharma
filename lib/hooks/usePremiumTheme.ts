'use client';

import { useMemo } from 'react';
import { useBillingState } from './useBillingState';

/**
 * Premium Theme Tokens
 * 
 * These tokens define the visual identity for premium (paid) users.
 * Components consume these tokens to avoid conditional styling clutter.
 */
export interface PremiumTokens {
    navbar: {
        bg: string;
        text: string;
        border: string;
        iconBg: string;
        iconText: string;
    };
    sidebar: {
        bg: string;
        shadow: string;
        border: string;
    };
    avatar: {
        ring: string;
        glow: string;
    };
    motion: {
        duration: string;
        easing: string;
        hoverScale: string;
    };
    shadows: {
        soft: string;
        glow: string;
    };
    accents: {
        shimmer: string;
        gradientFrom: string;
        gradientTo: string;
    };
    statusPill: {
        bg: string;
        text: string;
        label: string;
        icon?: any; // Changed to allow component or remains unused if handled in component
    };
    navbarGradient: string; // Shared gradient for seamless look
}

export interface PremiumTheme {
    /** Is user on a paid plan? */
    isPremium: boolean;

    /** Premium-aware design tokens */
    tokens: PremiumTokens;

    /** Data attribute for CSS variable overrides */
    dataAttribute: { 'data-premium'?: 'true' };
}

// Standard (free/trial) tokens
const STANDARD_TOKENS: PremiumTokens = {
    navbar: {
        bg: 'bg-white',
        text: 'text-gray-700',
        border: 'border-gray-100',
        iconBg: 'bg-emerald-50',
        iconText: 'text-emerald-600',
    },
    sidebar: {
        bg: 'bg-white',
        shadow: 'shadow-sm',
        border: 'border-gray-100',
    },
    avatar: {
        ring: 'border-emerald-200',
        glow: '',
    },
    motion: {
        duration: 'duration-200',
        easing: 'ease-out',
        hoverScale: 'hover:scale-100',
    },
    shadows: {
        soft: 'shadow-sm',
        glow: '',
    },
    accents: {
        shimmer: '',
        gradientFrom: 'from-emerald-500',
        gradientTo: 'to-emerald-600',
    },
    statusPill: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        label: 'Trial',
    },
    navbarGradient: 'bg-white',
};

// Premium (paid) tokens - The "belonging" experience
// Reverting to Emerald but keeping Glass + Premium feel
const PREMIUM_TOKENS: PremiumTokens = {
    navbar: {
        // Shared gradient token used here
        bg: '', // Will be applied via navbarGradient
        text: 'text-white',
        border: 'border-white/10',
        // Glass effect for icons
        iconBg: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all',
        iconText: 'text-white',
    },
    sidebar: {
        bg: 'bg-white', // Main sidebar body stays white/clean
        shadow: 'shadow-2xl shadow-emerald-900/10',
        border: 'border-emerald-500/10', // Subtle "high shade" emerald line for definition
    },
    avatar: {
        // Glowing ring effect
        ring: 'border-2 border-white/20 ring-2 ring-white/10',
        glow: 'shadow-[0_0_15px_rgba(255,255,255,0.3)]',
    },
    motion: {
        duration: 'duration-350',
        easing: 'ease-[cubic-bezier(0.22,0.61,0.36,1)]',
        hoverScale: 'hover:scale-[1.02]',
    },
    shadows: {
        soft: 'shadow-xl shadow-emerald-900/10',
        glow: 'shadow-lg shadow-emerald-500/30',
    },
    accents: {
        shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]',
        gradientFrom: 'from-emerald-400',
        gradientTo: 'to-teal-300',
    },
    statusPill: {
        // Glass pill with glow
        bg: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-black/5',
        text: 'text-white font-semibold',
        label: 'Pro',
    },
    // The seamless gradient shared between navbar and sidebar header
    // Vertical gradient allows horizontal continuity without seam mismatch
    navbarGradient: 'bg-gradient-to-b from-emerald-600 to-emerald-500',
};

/**
 * Hook to get premium-aware theme tokens
 * 
 * Usage:
 * ```tsx
 * const { isPremium, tokens } = usePremiumTheme();
 * 
 * return <nav className={tokens.navbar.bg}>...</nav>;
 * ```
 * 
 * Core principle: Components consume tokens directly without conditional logic.
 * The hook handles the isPaid check internally.
 */
export function usePremiumTheme(): PremiumTheme {
    const { isPaid } = useBillingState();

    return useMemo(() => ({
        isPremium: isPaid,
        tokens: isPaid ? PREMIUM_TOKENS : STANDARD_TOKENS,
        dataAttribute: isPaid ? { 'data-premium': 'true' as const } : {},
    }), [isPaid]);
}

/**
 * Get premium class by merging base class with premium variant
 * Utility for components that need to conditionally merge classes
 */
export function getPremiumClass(
    isPremium: boolean,
    standardClass: string,
    premiumClass: string
): string {
    return isPremium ? premiumClass : standardClass;
}
