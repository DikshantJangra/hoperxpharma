"use strict";
/**
 * Production-Grade Logger
 *
 * Structured logging with Winston for production observability
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logApiRequest = exports.logPerformance = exports.logError = exports.imageLogger = exports.ingestionLogger = exports.migrationLogger = exports.searchLogger = exports.medicineLogger = exports.createModuleLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const logDir = process.env.LOG_DIR || 'logs';
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston_1.default.addColors(colors);
// Define format
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Define console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`));
// Define transports
const transports = [
    // Console transport for development
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    }),
];
// Add file transports for production
if (process.env.NODE_ENV === 'production') {
    // Error logs
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format,
    }));
    // Combined logs
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format,
    }));
    // HTTP logs
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logDir, 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        maxSize: '20m',
        maxFiles: '7d',
        format,
    }));
}
// Create logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    levels,
    format,
    transports,
    exitOnError: false,
});
// Create child loggers for different modules
const createModuleLogger = (module) => {
    return logger.child({ module });
};
exports.createModuleLogger = createModuleLogger;
// Medicine Master specific loggers
exports.medicineLogger = (0, exports.createModuleLogger)('medicine-master');
exports.searchLogger = (0, exports.createModuleLogger)('search');
exports.migrationLogger = (0, exports.createModuleLogger)('migration');
exports.ingestionLogger = (0, exports.createModuleLogger)('ingestion');
exports.imageLogger = (0, exports.createModuleLogger)('image');
// Helper functions for structured logging
const logError = (error, context) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
const logPerformance = (operation, duration, context) => {
    logger.info({
        message: `Performance: ${operation}`,
        duration,
        ...context,
    });
};
exports.logPerformance = logPerformance;
const logApiRequest = (method, path, statusCode, duration) => {
    logger.http({
        message: 'API Request',
        method,
        path,
        statusCode,
        duration,
    });
};
exports.logApiRequest = logApiRequest;
exports.default = logger;
