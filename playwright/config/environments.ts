/**
 * Environment Configuration for Playwright Tests
 * 
 * Manages environment-specific settings like URLs, credentials, and feature flags
 */

export interface Environment {
    name: string;
    baseURL: string;
    apiURL: string;
    databaseURL?: string;
    auth: {
        testUser: {
            email: string;
            password: string;
        };
        testAdmin: {
            email: string;
            password: string;
        };
    };
    features: {
        enableOAuth: boolean;
        enableMagicLink: boolean;
        enableWhatsApp: boolean;
    };
}

const environments: Record<string, Environment> = {
    development: {
        name: 'development',
        baseURL: 'http://localhost:3000',
        apiURL: 'http://127.0.0.1:8000',
        databaseURL: process.env.TEST_DATABASE_URL || 'postgresql://dikshantjangra@localhost:5432/hoperxpharma_test',
        auth: {
            testUser: {
                email: process.env.TEST_USER_EMAIL || 'test@automation.com',
                password: process.env.TEST_USER_PASSWORD || 'Test@12345',
            },
            testAdmin: {
                email: process.env.TEST_ADMIN_EMAIL || 'admin@automation.com',
                password: process.env.TEST_ADMIN_PASSWORD || 'Admin@12345',
            },
        },
        features: {
            enableOAuth: true,
            enableMagicLink: true,
            enableWhatsApp: false,
        },
    },

    staging: {
        name: 'staging',
        baseURL: process.env.STAGING_URL || 'https://staging.hoperxpharma.com',
        apiURL: process.env.STAGING_API_URL || 'https://api-staging.hoperxpharma.com',
        auth: {
            testUser: {
                email: process.env.STAGING_TEST_USER_EMAIL || 'test@staging.com',
                password: process.env.STAGING_TEST_USER_PASSWORD || '',
            },
            testAdmin: {
                email: process.env.STAGING_TEST_ADMIN_EMAIL || 'admin@staging.com',
                password: process.env.STAGING_TEST_ADMIN_PASSWORD || '',
            },
        },
        features: {
            enableOAuth: true,
            enableMagicLink: true,
            enableWhatsApp: true,
        },
    },

    production: {
        name: 'production',
        baseURL: process.env.PROD_URL || 'https://hoperxpharma.com',
        apiURL: process.env.PROD_API_URL || 'https://api.hoperxpharma.com',
        auth: {
            testUser: {
                email: process.env.PROD_TEST_USER_EMAIL || '',
                password: process.env.PROD_TEST_USER_PASSWORD || '',
            },
            testAdmin: {
                email: process.env.PROD_TEST_ADMIN_EMAIL || '',
                password: process.env.PROD_TEST_ADMIN_PASSWORD || '',
            },
        },
        features: {
            enableOAuth: true,
            enableMagicLink: true,
            enableWhatsApp: true,
        },
    },
};

/**
 * Get the current environment configuration
 */
export function getEnvironment(): Environment {
    const envName = process.env.TEST_ENV || process.env.NODE_ENV || 'development';
    const env = environments[envName];

    if (!env) {
        throw new Error(`Unknown environment: ${envName}`);
    }

    return env;
}

/**
 * Check if a feature is enabled in the current environment
 */
export function isFeatureEnabled(feature: keyof Environment['features']): boolean {
    const env = getEnvironment();
    return env.features[feature];
}
