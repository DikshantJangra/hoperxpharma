const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/**
 * Enhanced Global Error Handler
 * Handles all types of errors with detailed logging and consistent responses
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert Prisma errors to ApiError
    if (err.name === 'PrismaClientKnownRequestError') {
        error = handlePrismaError(err);
    }
    // Convert Validation errors (express-validator, Zod, etc.)
    else if (err.name === 'ZodError') {
        error = handleZodError(err);
    }
    // Convert JWT errors
    else if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Invalid token');
    }
    else if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token expired');
    }
    // Convert Multer errors (file upload)
    else if (err.name === 'MulterError') {
        error = handleMulterError(err);
    }
    // Convert generic errors to ApiError
    else if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, 'UNKNOWN_ERROR', null, err.stack);
    }

    // Determine log level based on error type
    const logLevel = error.statusCode >= 500 ? 'error' : error.statusCode >= 400 ? 'warn' : 'info';

    // Log error with context
    logger[logLevel]('Request error', {
        message: error.message,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        isOperational: error.isOperational,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
        correlationId: req.correlationId,
        stack: error.statusCode >= 500 ? error.stack : undefined, // Only log stack for 5xx errors
    });

    // Send standardized error response
    const response = error.toJSON ? error.toJSON() : {
        success: false,
        statusCode: error.statusCode || 500,
        message: error.message,
        timestamp: new Date().toISOString()
    };

    // Add correlation ID for tracing
    if (req.correlationId) {
        response.correlationId = req.correlationId;
    }

    res.status(error.statusCode).json(response);
};

/**
 * Handle Prisma database errors
 */
function handlePrismaError(err) {
    switch (err.code) {
        case 'P2000':
            return ApiError.badRequest('Value too long for column', 'DATABASE_VALIDATION_ERROR', {
                field: err.meta?.target
            });
        case 'P2001':
            return ApiError.notFound('Record not found');
        case 'P2002':
            return ApiError.duplicateResource('Resource', err.meta?.target?.[0]);
        case 'P2003':
            return ApiError.badRequest('Foreign key constraint failed', 'FOREIGN_KEY_ERROR', {
                field: err.meta?.field_name
            });
        case 'P2025':
            return ApiError.notFound('Record to update/delete not found');
        case 'P2024':
            return ApiError.timeout('Database query');
        default:
            return ApiError.database('Database operation failed', {
                code: err.code,
                meta: err.meta
            });
    }
}

/**
 * Handle Zod validation errors
 */
function handleZodError(err) {
    const fields = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
    }));

    return ApiError.validation('Validation failed', fields);
}

/**
 * Handle Multer file upload errors
 */
function handleMulterError(err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return ApiError.badRequest('File too large', 'FILE_TOO_LARGE', {
            maxSize: err.limit
        });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return ApiError.badRequest('Too many files', 'TOO_MANY_FILES', {
            maxCount: err.limit
        });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return ApiError.badRequest('Unexpected file field', 'UNEXPECTED_FILE', {
            fieldName: err.field
        });
    }
    return ApiError.badRequest(`File upload error: ${err.message}`, 'FILE_UPLOAD_ERROR');
}

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
    const error = ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND', {
        method: req.method,
        path: req.originalUrl
    });
    next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Catch unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise
    });
    // Don't exit process, just log
});

/**
 * Catch uncaught exceptions
 */
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception - Server will exit', {
        message: error.message,
        stack: error.stack
    });

    // Give time for logs to flush
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler
};
