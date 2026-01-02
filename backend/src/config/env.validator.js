const logger = require('./logger');

const requiredVars = [
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'FRONTEND_URL',
    // 'API_BASE_URL', // Optional, defaults to localhost
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

function validateEnv() {
    const missing = requiredVars.filter(key => !process.env[key]);

    if (missing.length > 0) {
        logger.error('CRITICAL: Missing required environment variables:');
        missing.forEach(key => logger.error(` - ${key}`));

        // In production, we might want to crash if configs are missing
        if (process.env.NODE_ENV === 'production') {
            logger.error('Server cannot start without these variables in production.');
            // process.exit(1); // Uncomment to enforce strict validation
        } else {
            logger.warn('Running with missing variables in development. Some features may fail.');
        }
    } else {
        logger.info('Environment variables validation passed.');
    }
}

module.exports = validateEnv;
