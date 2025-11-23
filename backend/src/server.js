const dotenv = require('dotenv');
const app = require('./app');
const database = require('./config/database');
const logger = require('./config/logger');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8000;

// Connect to database
database.connect().then(() => {
    // Start server
    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server is running on http://localhost:${PORT}`);
        logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
        logger.info(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
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