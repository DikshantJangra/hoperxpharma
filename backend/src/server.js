const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

// Validate environment variables BEFORE loading other modules
// Validate environment variables BEFORE loading other modules
const validateEnv = require('./config/env.validator');
validateEnv();
const validatedEnv = process.env;

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

    // Initialize Alert Event Listener (connects events to alerts)
    const alertEventListener = require('./events/alertEventListener');
    alertEventListener.initialize();
    logger.info('✅ Alert event system initialized');

    // Initialize Scheduler
    const schedulerService = require('./services/schedulerService');
    schedulerService.init();

    // Initialize Payment Background Jobs
    const { initializeJobs } = require('./jobs');
    initializeJobs();
    logger.info('✅ Payment background jobs initialized');

    // Initialize Indian Pharmacy System Background Jobs
    const { startDailyBehavioralScoringJob } = require('./jobs/dailyBehavioralScoringJob');
    startDailyBehavioralScoringJob();
    logger.info('✅ Indian Pharmacy behavioral scoring job scheduled');

    // Initialize Typesense Keep-Alive (Production Only)
    if (validatedEnv.NODE_ENV === 'production' && validatedEnv.TYPESENSE_HOST) {
        const { checkTypesenseHealth } = require('./lib/typesense/client');
        
        // Ping Typesense every 10 minutes to prevent spin-down on free tier
        setInterval(async () => {
            try {
                const isHealthy = await checkTypesenseHealth();
                if (isHealthy) {
                    logger.info('✅ Typesense keep-alive ping successful');
                } else {
                    logger.warn('⚠️ Typesense health check returned unhealthy status');
                }
            } catch (error) {
                logger.warn('⚠️ Typesense keep-alive ping failed:', error.message);
            }
        }, 10 * 60 * 1000); // Every 10 minutes
        
        logger.info('✅ Typesense keep-alive initialized (10-minute interval)');
    }

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