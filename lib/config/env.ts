/**
 * Environment Configuration Utility
 * Ensures environment variables are properly configured
 */

/**
 * Get the API base URL from environment variables
 * Throws an error if not configured (prevents silent failures in production)
 */
export function getApiBaseUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
        // In development, provide helpful error message
        if (process.env.NODE_ENV === 'development') {
            console.error(
                '❌ NEXT_PUBLIC_API_URL is not set!\n' +
                '   Please create a .env.local file with:\n' +
                '   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1\n' +
                '   Refer to .env.example for the complete configuration.'
            );
        }

        // In production, this is a critical error
        throw new Error(
            'NEXT_PUBLIC_API_URL environment variable is not configured. ' +
            'Please set this variable before starting the application.'
        );
    }

    return apiUrl;
}

/**
 * Validate that all required environment variables are present
 * Should be called during application initialization
 */
export function validateClientEnv(): void {
    const required = ['NEXT_PUBLIC_API_URL'];
    const missing: string[] = [];

    required.forEach(key => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    if (missing.length > 0) {
        const error = `Missing required environment variables: ${missing.join(', ')}`;

        if (process.env.NODE_ENV === 'production') {
            throw new Error(error);
        } else {
            console.warn(`⚠️  ${error}`);
            console.warn('   Application may not function correctly.');
            console.warn('   Please check .env.example for required variables.');
        }
    }
}

/**
 * Get application configuration
 */
export const appConfig = {
    apiBaseUrl: getApiBaseUrl(),
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'HopeRxPharma',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebug: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true',
} as const;
