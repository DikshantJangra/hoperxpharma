/**
 * Standardized Response Helpers
 * Provides consistent API response formats across the application
 */

/**
 * Success response helper
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        ...(data !== null && { data }),
        ...(meta && { meta }),
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
};

/**
 * Paginated response helper
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
    const response = {
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.limit),
            hasNext: pagination.page * pagination.limit < pagination.total,
            hasPrev: pagination.page > 1
        },
        timestamp: new Date().toISOString()
    };

    return res.status(200).json(response);
};

/**
 * Created response helper (201)
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
    return successResponse(res, data, message, 201);
};

/**
 * Accepted response helper (202)
 */
const acceptedResponse = (res, data = null, message = 'Request accepted for processing') => {
    return successResponse(res, data, message, 202);
};

/**
 * No content response helper (204)
 */
const noContentResponse = (res) => {
    return res.status(204).send();
};

/**
 * Error response helper (used for expected errors)
 */
const errorResponse = (res, message, statusCode = 400, errorCode = null, details = null) => {
    const response = {
        success: false,
        message,
        ...(errorCode && { errorCode }),
        ...(details && { details }),
        timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
};

/**
 * Validation error response helper
 */
const validationErrorResponse = (res, errors, message = 'Validation failed') => {
    return errorResponse(res, message, 400, 'VALIDATION_ERROR', { fields: errors });
};

module.exports = {
    successResponse,
    paginatedResponse,
    createdResponse,
    acceptedResponse,
    noContentResponse,
    errorResponse,
    validationErrorResponse
};
