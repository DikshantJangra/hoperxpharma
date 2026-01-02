/**
 * Enhanced Custom API Error class for standardized error handling
 * Provides comprehensive error types and metadata support
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, errorCode = null, details = null, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.success = false;
        this.errorCode = errorCode; // Machine-readable error code
        this.details = details; // Additional error context/details
        this.timestamp = new Date().toISOString();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert error to JSON response format
     */
    toJSON() {
        const response = {
            success: false,
            statusCode: this.statusCode,
            message: this.message,
            timestamp: this.timestamp
        };

        if (this.errorCode) {
            response.errorCode = this.errorCode;
        }

        if (this.details) {
            response.details = this.details;
        }

        // Include stack in development
        if (process.env.NODE_ENV === 'development' && this.stack) {
            response.stack = this.stack;
        }

        return response;
    }

    // 4xx Client Errors
    static badRequest(message = 'Bad Request', errorCode = 'BAD_REQUEST', details = null) {
        return new ApiError(400, message, true, errorCode, details);
    }

    static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED', details = null) {
        return new ApiError(401, message, true, errorCode, details);
    }

    static paymentRequired(message = 'Payment Required', errorCode = 'PAYMENT_REQUIRED', details = null) {
        return new ApiError(402, message, true, errorCode, details);
    }

    static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN', details = null) {
        return new ApiError(403, message, true, errorCode, details);
    }

    static notFound(message = 'Not Found', errorCode = 'NOT_FOUND', details = null) {
        return new ApiError(404, message, true, errorCode, details);
    }

    static methodNotAllowed(message = 'Method Not Allowed', errorCode = 'METHOD_NOT_ALLOWED', details = null) {
        return new ApiError(405, message, true, errorCode, details);
    }

    static conflict(message = 'Conflict', errorCode = 'CONFLICT', details = null) {
        return new ApiError(409, message, true, errorCode, details);
    }

    static gone(message = 'Gone', errorCode = 'GONE', details = null) {
        return new ApiError(410, message, true, errorCode, details);
    }

    static unprocessableEntity(message = 'Unprocessable Entity', errorCode = 'UNPROCESSABLE_ENTITY', details = null) {
        return new ApiError(422, message, true, errorCode, details);
    }

    static tooManyRequests(message = 'Too Many Requests', errorCode = 'RATE_LIMIT_EXCEEDED', details = null) {
        return new ApiError(429, message, true, errorCode, details);
    }

    // 5xx Server Errors
    static internal(message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR', details = null) {
        return new ApiError(500, message, false, errorCode, details);
    }

    static notImplemented(message = 'Not Implemented', errorCode = 'NOT_IMPLEMENTED', details = null) {
        return new ApiError(501, message, false, errorCode, details);
    }

    static badGateway(message = 'Bad Gateway', errorCode = 'BAD_GATEWAY', details = null) {
        return new ApiError(502, message, false, errorCode, details);
    }

    static serviceUnavailable(message = 'Service Unavailable', errorCode = 'SERVICE_UNAVAILABLE', details = null) {
        return new ApiError(503, message, false, errorCode, details);
    }

    static gatewayTimeout(message = 'Gateway Timeout', errorCode = 'GATEWAY_TIMEOUT', details = null) {
        return new ApiError(504, message, false, errorCode, details);
    }

    // Domain-Specific Errors
    static validation(message, fields = null) {
        return new ApiError(400, message, true, 'VALIDATION_ERROR', { fields });
    }

    static authentication(message = 'Authentication failed') {
        return new ApiError(401, message, true, 'AUTHENTICATION_FAILED');
    }

    static authorization(message = 'Insufficient permissions') {
        return new ApiError(403, message, true, 'AUTHORIZATION_FAILED');
    }

    static resourceNotFound(resource, identifier = null) {
        const message = identifier
            ? `${resource} with identifier '${identifier}' not found`
            : `${resource} not found`;
        return new ApiError(404, message, true, 'RESOURCE_NOT_FOUND', { resource, identifier });
    }

    static duplicateResource(resource, field = null) {
        const message = field
            ? `${resource} with this ${field} already exists`
            : `${resource} already exists`;
        return new ApiError(409, message, true, 'DUPLICATE_RESOURCE', { resource, field });
    }

    static businessLogic(message, errorCode = 'BUSINESS_LOGIC_ERROR', details = null) {
        return new ApiError(422, message, true, errorCode, details);
    }

    static database(message = 'Database error occurred', details = null) {
        return new ApiError(500, message, false, 'DATABASE_ERROR', details);
    }

    static externalService(service, message = 'External service error', details = null) {
        return new ApiError(502, `${service} service error: ${message}`, false, 'EXTERNAL_SERVICE_ERROR', {
            service,
            ...details
        });
    }

    static timeout(operation = 'Operation', details = null) {
        return new ApiError(504, `${operation} timed out`, false, 'TIMEOUT_ERROR', { operation, ...details });
    }
}

module.exports = ApiError;
