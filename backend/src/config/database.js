const { PrismaClient } = require('@prisma/client');


const logger = require('./logger');

/**
 * Prisma Client Singleton
 * Ensures only one instance of Prisma Client is created
 */
class Database {
    constructor() {
        if (!Database.instance) {
            this.prisma = new PrismaClient({
                log: [
                    { level: 'query', emit: 'event' },
                    { level: 'error', emit: 'event' },
                    { level: 'warn', emit: 'event' },
                ],
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&connection_limit=10' : '?connection_limit=10'),
                    },
                },
            });

            // Query logging disabled to reduce console noise
            // Enable via LOG_QUERIES=true if needed for debugging
            if (process.env.NODE_ENV === 'development' && process.env.LOG_QUERIES === 'true') {
                this.prisma.$on('query', (e) => {
                    logger.debug(`Query: ${e.query}`);
                    logger.debug(`Duration: ${e.duration}ms`);
                });
            }

            // Log errors
            this.prisma.$on('error', (e) => {
                logger.error('Prisma Error:', e);
            });

            // Log warnings
            this.prisma.$on('warn', (e) => {
                logger.warn('Prisma Warning:', e);
            });

            Database.instance = this;
        }

        return Database.instance;
    }

    async connect() {
        try {
            await this.prisma.$connect();
            logger.info('✅ Database connected successfully');
        } catch (error) {
            logger.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger.info('Database disconnected');
        } catch (error) {
            logger.error('Error disconnecting from database:', error);
        }
    }

    getClient() {
        return this.prisma;
    }
}

// Export singleton instance
const database = new Database();
module.exports = database;
