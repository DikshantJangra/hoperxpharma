/**
 * Standardized API Response class
 */
class ApiResponse {
    constructor(statusCode, data, message = 'Success', meta = null) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        if (meta) {
            this.meta = meta;
        }
    }

    static success(data, message = 'Success', meta = null) {
        return new ApiResponse(200, data, message, meta);
    }

    static created(data, message = 'Created successfully', meta = null) {
        return new ApiResponse(201, data, message, meta);
    }

    static noContent(message = 'No content') {
        return new ApiResponse(204, null, message);
    }

    static paginated(data, pagination) {
        return new ApiResponse(200, data, 'Success', {
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: Math.ceil(pagination.total / pagination.limit),
            },
        });
    }
}

module.exports = ApiResponse;
