const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { HTTP_STATUS } = require('../constants');

/**
 * Global error handling middleware
 * Catches all errors and sends standardized error responses
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // If error is not an instance of ApiError, convert it
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    // Log error
    const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel]({
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?.id,
    });

    // Send error response
    const response = {
        success: false,
        statusCode: error.statusCode,
        message: error.message,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};

module.exports = { errorHandler, notFoundHandler };
