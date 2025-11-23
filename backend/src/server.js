const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const app = require('./app');
const database = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 8000;

// Log startup info
logger.info('Starting HopeRxPharma Backend...');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Port: ${PORT}`);
logger.info(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

// Connect to database
database.connect().then(() => {
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server is running on port ${PORT}`);
        logger.info(`API Documentation: /api-docs`);
        logger.info(`Health Check: /api/v1/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
        logger.info(`${signal} received. Starting graceful shutdown...`);

        server.close(async () => {
            logger.info('HTTP server closed');

            await database.disconnect();
            logger.info('Database connection closed');

            process.exit(0);
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        gracefulShutdown('unhandledRejection');
    });
}).catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});