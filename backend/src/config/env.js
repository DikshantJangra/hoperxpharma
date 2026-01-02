const { z } = require('zod');

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().default('8000'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_ACCESS_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),
    CORS_ORIGIN: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
    try {
        const env = envSchema.parse(process.env);
        return env;
    } catch (error) {
        console.error('❌ Invalid environment variables:');
        if (error && error.errors) {
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

module.exports = { validateEnv };
