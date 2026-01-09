/**
 * Premium Welcome Animation Utilities
 * Calm, GPU-accelerated motion for trust-building
 */

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Premium easing curve - smooth, not snappy
 * Used for all welcome transitions
 */
export const PREMIUM_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Slower easing for feature reveals
 */
export const REVEAL_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ============================================================================
// Keyframe Animations
// ============================================================================

/**
 * Gentle upward fade-in
 * Used for: Section entries, primary messages
 */
export const fadeInUp = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

/**
 * Simple fade-in
 * Used for: Secondary text, subtle elements
 */
export const fadeIn = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

/**
 * Fade-out for exit
 */
export const fadeOut = `
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;

/**
 * Sequential reveal for capabilities
 */
export const sequentialReveal = `
  @keyframes sequentialReveal {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ============================================================================
// Animation Classes
// ============================================================================

export const animationClasses = {
    fadeInUp: `animate-[fadeInUp_600ms_${PREMIUM_EASING}_forwards]`,
    fadeIn: `animate-[fadeIn_400ms_${PREMIUM_EASING}_forwards]`,
    fadeOut: `animate-[fadeOut_300ms_${PREMIUM_EASING}_forwards]`,
    sequentialReveal: `animate-[sequentialReveal_500ms_${REVEAL_EASING}_forwards]`,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation class with reduced motion fallback
 */
export const getAnimationClass = (animationClass: string): string => {
    if (prefersReducedMotion()) {
        return 'transition-opacity duration-200';
    }
    return animationClass;
};

/**
 * Sleep utility for sequential animations
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// ============================================================================
// Animation Injection
// ============================================================================

/**
 * Inject keyframes into document head
 * Call once on app initialization
 */
export const injectWelcomeAnimations = () => {
    if (typeof document === 'undefined') return;

    const styleId = 'welcome-animations';

    // Avoid duplicate injection
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
    ${fadeInUp}
    ${fadeIn}
    ${fadeOut}
    ${sequentialReveal}
  `;

    document.head.appendChild(style);
};
