/**
 * Design Tokens for Passwordless Auth UI
 * Premium, sophisticated design system matching the detailed spec
 */

export const authTokens = {
    colors: {
        // Primary Green (HopeRx Brand)
        primary: '#12B981',
        primaryDark: '#10A37F',
        primaryLight: '#6EE7B7',
        primaryGlow: 'rgba(18, 185, 129, 0.15)',

        // Backgrounds
        white: '#FFFFFF',
        offWhite: '#FAFAFA',
        lightGray: '#F8F9FA',

        // Text Colors
        textDark: '#111827',      // Headlines
        textMedium: '#4B5563',   // Body
        textLight: '#6B7280',    // Supporting
        textMuted: '#9CA3AF',    // Hints/placeholders

        // Borders
        borderDefault: '#E5E7EB',
        borderSubtle: '#D1D5DB',

        // Accent Colors
        greenTint: '#F0FDF4',    // Light green backgrounds

        // Functional
        error: '#EF4444',
        success: '#10B981',
    },

    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

        // Font Sizes
        headline: '32px',
        headlineLarge: '36px',
        subheadline: '24px',
        body: '16px',
        bodySmall: '15px',
        label: '14px',
        caption: '13px',
        tiny: '12px',
        micro: '11px',

        // Font Weights
        regular: 400,
        medium: 500,
        semiBold: 600,
        bold: 700,

        // Line Heights
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.6,
    },

    spacing: {
        // 8px grid system
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '40px',
        '3xl': '48px',
        '4xl': '56px',
        '5xl': '64px',
    },

    borderRadius: {
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },

    shadows: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        cardHover: '0 4px 16px rgba(0, 0, 0, 0.08)',
        button: '0 4px 12px rgba(18, 185, 129, 0.3)',
        focus: '0 0 0 3px rgba(18, 185, 129, 0.1)',
    },

    transitions: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // Component-specific tokens
    input: {
        height: '56px',
        heightCompact: '48px',
        padding: '16px 20px',
        iconSize: '20px',
        iconSpacing: '12px',
    },

    button: {
        height: '56px',
        heightCompact: '48px',
        padding: '16px 24px',
    },

    card: {
        maxWidth: '440px',
        padding: '48px 56px',
        paddingCompact: '40px 48px',
    },
};

/**
 * Helper function to get design tokens
 */
export const getAuthToken = (path: string): string => {
    const keys = path.split('.');
    let value: any = authTokens;

    for (const key of keys) {
        value = value?.[key];
    }

    return value || '';
};
