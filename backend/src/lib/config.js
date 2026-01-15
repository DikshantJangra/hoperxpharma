"use strict";
/**
 * Configuration Management
 *
 * Centralized configuration with validation and type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var zod_1 = require("zod");
// Configuration schema
var configSchema = zod_1.z.object({
    // Environment
    nodeEnv: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    port: zod_1.z.number().default(3000),
    logLevel: zod_1.z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    // Database
    databaseUrl: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    databasePoolMin: zod_1.z.number().default(2),
    databasePoolMax: zod_1.z.number().default(10),
    // Typesense (required for production, optional for development)
    typesenseHost: zod_1.z.string().default('localhost'),
    typesensePort: zod_1.z.number().default(8108),
    typesenseApiKey: zod_1.z.string().refine(function (val) {
        // Required in production, optional in development
        if (process.env.NODE_ENV === 'production' && !val) {
            return false;
        }
        return true;
    }, {
        message: 'TYPESENSE_API_KEY is required in production',
    }).optional(),
    typesenseProtocol: zod_1.z.enum(['http', 'https']).default('http'),
    typesenseCollectionName: zod_1.z.string().default('medicines'),
    // Cloudflare R2
    r2Endpoint: zod_1.z.string().optional(),
    r2AccessKeyId: zod_1.z.string().optional(),
    r2SecretAccessKey: zod_1.z.string().optional(),
    r2BucketName: zod_1.z.string().default('medicine-images'),
    r2PublicUrl: zod_1.z.string().optional(),
    // Redis
    redisUrl: zod_1.z.string().optional(),
    redisHost: zod_1.z.string().default('localhost'),
    redisPort: zod_1.z.number().default(6379),
    // API
    apiRateLimit: zod_1.z.number().default(1000), // requests per minute per store
    apiMaxResultsPerQuery: zod_1.z.number().default(100),
    apiMaxBulkOperationSize: zod_1.z.number().default(1000),
    // JWT
    jwtSecret: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    jwtExpiresIn: zod_1.z.string().default('7d'),
    // CORS
    corsOrigin: zod_1.z.string().default('*'),
    // File Upload
    maxFileSize: zod_1.z.number().default(10 * 1024 * 1024), // 10MB
    // Migration
    migrationBatchSize: zod_1.z.number().default(100),
    migrationDedupeThreshold: zod_1.z.number().default(85),
});
// Parse and validate configuration
function loadConfig() {
    var rawConfig = {
        // Environment
        nodeEnv: process.env.NODE_ENV,
        port: parseInt(process.env.PORT || '3000', 10),
        logLevel: process.env.LOG_LEVEL,
        // Database
        databaseUrl: process.env.DATABASE_URL,
        databasePoolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
        databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
        // Typesense
        typesenseHost: process.env.TYPESENSE_HOST,
        typesensePort: parseInt(process.env.TYPESENSE_PORT || '8108', 10),
        typesenseApiKey: process.env.TYPESENSE_API_KEY,
        typesenseProtocol: process.env.TYPESENSE_PROTOCOL,
        typesenseCollectionName: process.env.TYPESENSE_COLLECTION_NAME,
        // Cloudflare R2
        r2Endpoint: process.env.R2_ENDPOINT,
        r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
        r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        r2BucketName: process.env.R2_BUCKET_NAME,
        r2PublicUrl: process.env.R2_PUBLIC_URL,
        // Redis
        redisUrl: process.env.REDIS_URL,
        redisHost: process.env.REDIS_HOST,
        redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
        // API
        apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '1000', 10),
        apiMaxResultsPerQuery: parseInt(process.env.API_MAX_RESULTS_PER_QUERY || '100', 10),
        apiMaxBulkOperationSize: parseInt(process.env.API_MAX_BULK_OPERATION_SIZE || '1000', 10),
        // JWT
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
        // CORS
        corsOrigin: process.env.CORS_ORIGIN,
        // File Upload
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(10 * 1024 * 1024), 10),
        // Migration
        migrationBatchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '100', 10),
        migrationDedupeThreshold: parseInt(process.env.MIGRATION_DEDUPE_THRESHOLD || '85', 10),
    };
    try {
        return configSchema.parse(rawConfig);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error('Configuration validation failed:');
            error.errors.forEach(function (err) {
                console.error("  - ".concat(err.path.join('.'), ": ").concat(err.message));
            });
            process.exit(1);
        }
        throw error;
    }
}
// Export validated configuration
exports.config = loadConfig();
exports.default = exports.config;
