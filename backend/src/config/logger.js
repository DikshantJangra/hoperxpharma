const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';

// Log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (human-readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp, correlationId, ...meta }) => {
        const corrId = correlationId ? `[${correlationId}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${corrId}: ${message} ${metaStr}`;
    })
);

// Transports array
const transports = [];

// Development: Console only
if (isDevelopment) {
    transports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || 'debug',
            format: consoleFormat,
        })
    );
}

// Production: Console + Files with rotation
if (isProduction) {
    // Console for cloud providers (Heroku, AWS, etc.)
    transports.push(
        new winston.transports.Console({
            level: process.env.LOG_LEVEL || 'info',
            format: consoleFormat,
        })
    );

    // Error log file (14 days retention)
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat,
        })
    );

    // Combined log file (7 days retention)
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: path.join(__dirname, '../../logs/combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',
            format: logFormat,
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: logFormat,
    transports,
    exitOnError: false,
});

// Handle unhandled exceptions
logger.exceptions.handle(
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/exceptions.log'),
    })
);

// Handle unhandled promise rejections
logger.rejections.handle(
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/rejections.log'),
    })
);

/**
 * Helper to create child logger with correlation ID
 */
logger.withCorrelationId = (correlationId) => {
    return {
        debug: (message, meta = {}) => logger.debug(message, { ...meta, correlationId }),
        info: (message, meta = {}) => logger.info(message, { ...meta, correlationId }),
        warn: (message, meta = {}) => logger.warn(message, { ...meta, correlationId }),
        error: (message, meta = {}) => logger.error(message, { ...meta, correlationId }),
    };
};

module.exports = logger;

