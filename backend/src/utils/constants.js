/**
 * Application-wide constants
 */

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
};

const USER_ROLES = {
    ADMIN: 'ADMIN',
    PHARMACIST: 'PHARMACIST',
    TECHNICIAN: 'TECHNICIAN',
    CASHIER: 'CASHIER',
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};

const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET_PASSWORD: 'resetPassword',
};

const TOKEN_EXPIRY = {
    ACCESS: '1h',
    REFRESH: '7d',
    RESET_PASSWORD: '1h',
};

const MESSAGES = {
    AUTH: {
        SIGNUP_SUCCESS: 'User registered successfully',
        LOGIN_SUCCESS: 'Login successful',
        LOGOUT_SUCCESS: 'Logout successful',
        INVALID_CREDENTIALS: 'Invalid email or password',
        USER_EXISTS: 'User already exists with this email or phone number',
        TOKEN_EXPIRED: 'Token has expired',
        TOKEN_INVALID: 'Invalid token',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'You do not have permission to perform this action',
    },
    VALIDATION: {
        REQUIRED_FIELDS: 'All required fields must be provided',
        INVALID_EMAIL: 'Invalid email format',
        INVALID_PHONE: 'Invalid phone number format',
        PASSWORD_MISMATCH: 'Passwords do not match',
        PASSWORD_WEAK: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
    },
    COMMON: {
        SUCCESS: 'Operation completed successfully',
        CREATED: 'Resource created successfully',
        UPDATED: 'Resource updated successfully',
        DELETED: 'Resource deleted successfully',
        NOT_FOUND: 'Resource not found',
        SERVER_ERROR: 'Internal server error',
    },
};

const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 10, // For login/signup
};

module.exports = {
    HTTP_STATUS,
    USER_ROLES,
    PAGINATION,
    TOKEN_TYPES,
    TOKEN_EXPIRY,
    MESSAGES,
    RATE_LIMIT,
};
