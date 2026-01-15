/**
 * Configuration Management
 * 
 * Centralized configuration with validation and type safety
 */

import { z } from 'zod';

// Configuration schema
const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.number().default(3000),
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Database
  databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
  databasePoolMin: z.number().default(2),
  databasePoolMax: z.number().default(10),

  // Typesense (required for production, optional for development)
  typesenseHost: z.string().default('localhost'),
  typesensePort: z.number().default(8108),
  typesenseApiKey: z.string().refine(
    (val) => {
      // Required in production, optional in development
      if (process.env.NODE_ENV === 'production' && !val) {
        return false;
      }
      return true;
    },
    {
      message: 'TYPESENSE_API_KEY is required in production',
    }
  ).optional(),
  typesenseProtocol: z.enum(['http', 'https']).default('http'),
  typesenseCollectionName: z.string().default('medicines'),

  // Cloudflare R2
  r2Endpoint: z.string().optional(),
  r2AccessKeyId: z.string().optional(),
  r2SecretAccessKey: z.string().optional(),
  r2BucketName: z.string().default('medicine-images'),
  r2PublicUrl: z.string().optional(),

  // Redis
  redisUrl: z.string().optional(),
  redisHost: z.string().default('localhost'),
  redisPort: z.number().default(6379),

  // API
  apiRateLimit: z.number().default(1000), // requests per minute per store
  apiMaxResultsPerQuery: z.number().default(100),
  apiMaxBulkOperationSize: z.number().default(1000),

  // JWT
  jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  jwtExpiresIn: z.string().default('7d'),

  // CORS
  corsOrigin: z.string().default('*'),

  // File Upload
  maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB

  // Migration
  migrationBatchSize: z.number().default(100),
  migrationDedupeThreshold: z.number().default(85),
});

// Parse and validate configuration
function loadConfig() {
  const rawConfig = {
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

// Export validated configuration
export const config = loadConfig();

// Type-safe config
export type Config = z.infer<typeof configSchema>;

export default config;
