"use strict";
/**
 * Prisma Client with Connection Pooling
 *
 * Production-grade database client with proper connection management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseConnection = void 0;
const client_1 = require("@prisma/client");
const logger_1 = __importDefault(require("./logger"));
const config_1 = require("./config");
// Prisma client options
const prismaOptions = {
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
    datasources: {
        db: {
            url: config_1.config.databaseUrl,
        },
    },
};
// Create Prisma client
const prisma = new client_1.PrismaClient(prismaOptions);
// Log queries in development
if (config_1.config.nodeEnv === 'development') {
    prisma.$on('query', (e) => {
        logger_1.default.debug({
            message: 'Database Query',
            query: e.query,
            params: e.params,
            duration: e.duration,
        });
    });
}
// Log errors
prisma.$on('error', (e) => {
    logger_1.default.error({
        message: 'Database Error',
        error: e.message,
        target: e.target,
    });
});
// Log warnings
prisma.$on('warn', (e) => {
    logger_1.default.warn({
        message: 'Database Warning',
        warning: e.message,
    });
});
// Graceful shutdown
const gracefulShutdown = async () => {
    logger_1.default.info('Disconnecting from database...');
    await prisma.$disconnect();
    logger_1.default.info('Database disconnected');
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
// Connection health check
const checkDatabaseConnection = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.default.error('Database connection check failed', error);
        return false;
    }
};
exports.checkDatabaseConnection = checkDatabaseConnection;
// Export singleton
exports.default = prisma;
