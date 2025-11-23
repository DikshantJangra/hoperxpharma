const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

console.log('Starting HopeRxPharma Backend...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${process.env.PORT || 8000}`);
console.log(`Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

try {
    var app = require('./app');
    console.log('App loaded');
    var database = require('./config/database');
    console.log('Database module loaded');
    var logger = require('./config/logger');
    console.log('Logger loaded');
} catch (error) {
    console.error('Failed to load modules:', error.message);
    console.error(error.stack);
    process.exit(1);
}

const PORT = process.env.PORT || 8000;

// Connect to database
database.connect().then(() => {
    console.log('✅ Database connected');
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
    console.error('Failed to start server:', error.message);
    console.error(error.stack);
    if (logger) logger.error('Failed to start server:', error);
    process.exit(1);
});