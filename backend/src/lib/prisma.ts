/**
 * Prisma Client with Connection Pooling
 * 
 * Production-grade database client with proper connection management
 */

import { PrismaClient } from '@prisma/client';
import logger from './logger';
import { config } from './config';

// Prisma client options
const prismaOptions = {
  log: [
    { level: 'query' as const, emit: 'event' as const },
    { level: 'error' as const, emit: 'event' as const },
    { level: 'warn' as const, emit: 'event' as const },
  ],
  datasources: {
    db: {
      url: config.databaseUrl,
    },
  },
};

// Create Prisma client
const prisma = new PrismaClient(prismaOptions);

// Log queries in development
if (config.nodeEnv === 'development') {
  (prisma as any).$on('query', (e: any) => {
    logger.debug({
      message: 'Database Query',
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });
}

// Log errors
(prisma as any).$on('error', (e: any) => {
  logger.error({
    message: 'Database Error',
    error: e.message,
    target: e.target,
  });
});

// Log warnings
(prisma as any).$on('warn', (e: any) => {
  logger.warn({
    message: 'Database Warning',
    warning: e.message,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Disconnecting from database...');
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed', error);
    return false;
  }
};

// Export singleton
export default prisma;
