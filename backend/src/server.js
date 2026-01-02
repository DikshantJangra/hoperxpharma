const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

// Validate environment variables BEFORE loading other modules
const { validateEnv } = require('./config/envValidator');
const validatedEnv = validateEnv();

console.log('Starting HopeRxPharma Backend (Restarted)...');
console.log(`Environment: ${validatedEnv.NODE_ENV}`);
console.log(`[System] Backend restarts applied. DB Stability & Dashboard Fixes ENABLED.`);
console.log(`Port: ${validatedEnv.PORT}`);
console.log(`Database URL configured: ${validatedEnv.DATABASE_URL ? 'Yes' : 'No'}`);

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

const PORT = validatedEnv.PORT;

// Connect to database
database.connect().then(() => {
    console.log('✅ Database connected');
    // Initialize Scheduler
    const schedulerService = require('./services/schedulerService');
    schedulerService.init();

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
        logger.info(`Server is running on port http://localhost:${PORT}`);
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

    // Handle Nodemon restart signal
    process.once('SIGUSR2', () => {
        logger.info('SIGUSR2 received (Nodemon restart). Closing database...');
        database.disconnect().then(() => {
            process.kill(process.pid, 'SIGUSR2');
        });
    });

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