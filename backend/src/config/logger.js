const winston = require('winston');
const path = require('path');

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

/**
 * Create logger instance
 */
const transports = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Only add file transports in development
if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
        })
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exceptionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log'),
        }),
    ] : [
        new winston.transports.Console({ format: consoleFormat }),
    ],
    rejectionHandlers: process.env.NODE_ENV !== 'production' ? [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log'),
        }),
    ] : [
        new winston.transports.Console({ format: consoleFormat }),
    ],
});

// Don't log to files in test environment
if (process.env.NODE_ENV === 'test') {
    logger.transports.forEach((transport) => {
        if (transport instanceof winston.transports.File) {
            transport.silent = true;
        }
    });
}

module.exports = logger;
