const z = require('zod');

/**
 * Environment Variable Validation Schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
    // Server Configuration
    PORT: z.string().regex(/^\d+$/, 'PORT must be a valid port number').transform(Number).default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string').min(1, 'DATABASE_URL is required'),

    // JWT Secrets
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security').refine(
        (val) => val !== 'your-super-secret-jwt-key-change-this-in-production',
        { message: 'JWT_SECRET must be changed from default value in production' }
    ),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security').refine(
        (val) => val !== 'your-super-secret-refresh-key-change-this-in-production',
        { message: 'JWT_REFRESH_SECRET must be changed from default value in production' }
    ),
    JWT_EXPIRY: z.string().default('15m'),
    JWT_REFRESH_EXPIRY: z.string().default('7d'),

    // Encryption Keys (CRITICAL for production)
    WHATSAPP_ENCRYPTION_KEY: z.string().min(32, 'WHATSAPP_ENCRYPTION_KEY must be at least 32 characters').refine(
        (val) => val !== 'generate_random_32_byte_hex_key',
        { message: 'WHATSAPP_ENCRYPTION_KEY must be set to a secure random value' }
    ),
    SMTP_ENCRYPTION_KEY: z.string().min(32, 'SMTP_ENCRYPTION_KEY must be at least 32 characters').refine(
        (val) => val !== 'generate_random_32_byte_hex_key',
        { message: 'SMTP_ENCRYPTION_KEY must be set to a secure random value' }
    ),

    // CORS Configuration
    FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL').optional(),
    ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS must contain at least one origin').default('http://localhost:3000'),

    // File Upload
    MAX_FILE_SIZE_MB: z.string().regex(/^\d+$/).transform(Number).default('5'),
    UPLOAD_DIR: z.string().default('uploads'),

    // Cloudflare R2 (Optional)
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: z.string().url().optional(),

    // WhatsApp Configuration (Optional)
    FB_APP_ID: z.string().optional(),
    FB_APP_SECRET: z.string().optional(),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

    // Security
    COOKIE_SECURE: z.string().transform(val => val === 'true').default('false'),
    COOKIE_DOMAIN: z.string().default('localhost'),
    COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
    SESSION_TIMEOUT_MINUTES: z.string().regex(/^\d+$/).transform(Number).default('15'),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('100'),

    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_DIR: z.string().default('logs'),
    LOG_CONSOLE: z.string().transform(val => val === 'true').default('true'),
    ENABLE_DEBUG: z.string().transform(val => val === 'true').default('false'),
    ENABLE_QUERY_LOG: z.string().transform(val => val === 'true').default('false'),

    // API Key (Optional - for external services)
    API_KEY: z.string().optional(),
});

/**
 * Validates environment variables against the schema
 * @throws {Error} If validation fails with detailed error messages
 * @returns {object} Validated and typed environment variables
 */
function validateEnv() {
    try {
        // Special handling for production environment
        if (process.env.NODE_ENV === 'production') {
            // In production, enforce stricter validation
            if (!process.env.DATABASE_URL) {
                throw new Error('DATABASE_URL is required in production');
            }

            if (process.env.JWT_SECRET === 'E2!h7fX9y!R#8uP@bqT4zL6wV0jN3sD%') {
                throw new Error('JWT_SECRET must be changed from example value in production');
            }

            if (process.env.JWT_REFRESH_SECRET === 'F3!k8gY0z!S#9vQ@crU5aM7xW1kO4tE%') {
                throw new Error('JWT_REFRESH_SECRET must be changed from example value in production');
            }

            if (process.env.WHATSAPP_ENCRYPTION_KEY === 'generate_random_32_byte_hex_key') {
                throw new Error('WHATSAPP_ENCRYPTION_KEY must be set in production');
            }

            if (process.env.SMTP_ENCRYPTION_KEY === 'generate_random_32_byte_hex_key') {
                throw new Error('SMTP_ENCRYPTION_KEY must be set in production');
            }

            if (process.env.COOKIE_SECURE !== 'true') {
                console.warn('⚠️  WARNING: COOKIE_SECURE should be true in production');
            }
        }

        const validatedEnv = envSchema.parse(process.env);

        console.log('✅ Environment variables validated successfully');
        console.log(`   - Environment: ${validatedEnv.NODE_ENV}`);
        console.log(`   - Port: ${validatedEnv.PORT}`);
        console.log(`   - Database: Connected`);
        console.log(`   - JWT Expiry: ${validatedEnv.JWT_EXPIRY}`);
        console.log(`   - Session Timeout: ${validatedEnv.SESSION_TIMEOUT_MINUTES} minutes`);
        console.log(`   - Log Level: ${validatedEnv.LOG_LEVEL}`);

        return validatedEnv;
    } catch (error) {
        console.error('❌ Environment Variable Validation Failed:');

        if (error instanceof z.ZodError) {
            error.errors.forEach((err) => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
        } else {
            console.error(`   - ${error.message}`);
        }

        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        console.error('   Refer to backend/.env.example for the complete list of variables.\n');

        process.exit(1);
    }
}

/**
 * Get a validated environment variable
 * @param {string} key - The environment variable key
 * @returns {any} The validated value
 */
function getEnv(key) {
    if (!global.validatedEnv) {
        global.validatedEnv = validateEnv();
    }
    return global.validatedEnv[key];
}

module.exports = {
    validateEnv,
    getEnv,
    envSchema,
};
