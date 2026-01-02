const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * Custom morgan tokens for enhanced logging
 */
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('correlation-id', (req) => req.correlationId || '-');

/**
 * Morgan stream to Winston logger with correlation ID
 */
const stream = {
    write: (message) => logger.http(message.trim()),
};

/**
 * Morgan middleware configuration
 * Logs: method, URL, status, size, response time, user, and correlation ID
 */
const requestLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms - User: :user-id - CorrID: :correlation-id',
    { stream }
);

module.exports = requestLogger;
