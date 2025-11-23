const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * Custom token for morgan to log user ID
 */
morgan.token('user-id', (req) => req.user?.id || 'anonymous');

/**
 * Morgan stream to Winston logger
 */
const stream = {
    write: (message) => logger.http(message.trim()),
};

/**
 * Morgan middleware configuration
 */
const requestLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms - User: :user-id',
    { stream }
);

module.exports = requestLogger;
