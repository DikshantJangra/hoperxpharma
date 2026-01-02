const { body, query, param, validationResult } = require('express-validator');

/**
 * Input Sanitization Middleware
 * Protects against XSS, SQL injection, and other input-based attacks
 */

/**
 * Handle validation errors
 */
const handleErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

/**
 * Sanitize string input (trim and escape HTML)
 */
const sanitizeString = (field, options = {}) => {
    const { optional = false, minLength, maxLength } = options;

    let chain = body(field).trim().escape();

    if (!optional) {
        chain = chain.notEmpty().withMessage(`${field} is required`);
    }

    if (minLength) {
        chain = chain.isLength({ min: minLength }).withMessage(`${field} must be at least ${minLength} characters`);
    }

    if (maxLength) {
        chain = chain.isLength({ max: maxLength }).withMessage(`${field} must not exceed ${maxLength} characters`);
    }

    return chain;
};

/**
 * Sanitize email
 */
const sanitizeEmail = (field = 'email', options = {}) => {
    const { optional = false } = options;

    let chain = body(field).trim().normalizeEmail().isEmail().withMessage('Invalid email format');

    if (optional) {
        chain = chain.optional();
    }

    return chain;
};

/**
 * Sanitize phone number (Indian format)
 */
const sanitizePhone = (field = 'phoneNumber', options = {}) => {
    const { optional = false } = options;

    let chain = body(field)
        .trim()
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid Indian phone number (must be 10 digits starting with 6-9)');

    if (optional) {
        chain = chain.optional();
    }

    return chain;
};

/**
 * Sanitize number
 */
const sanitizeNumber = (field, options = {}) => {
    const { min, max, optional = false } = options;

    let chain = body(field).toFloat();

    if (!optional) {
        chain = chain.notEmpty().withMessage(`${field} is required`);
    }

    const floatOptions = {};
    if (min !== undefined) floatOptions.min = min;
    if (max !== undefined) floatOptions.max = max;

    chain = chain.isFloat(floatOptions).withMessage(
        `${field} must be a number${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`
    );

    return chain;
};

/**
 * Sanitize integer
 */
const sanitizeInteger = (field, options = {}) => {
    const { min, max, optional = false } = options;

    let chain = body(field).toInt();

    if (!optional) {
        chain = chain.notEmpty().withMessage(`${field} is required`);
    }

    const intOptions = {};
    if (min !== undefined) intOptions.min = min;
    if (max !== undefined) intOptions.max = max;

    chain = chain.isInt(intOptions).withMessage(
        `${field} must be an integer${min !== undefined ? ` >= ${min}` : ''}${max !== undefined ? ` <= ${max}` : ''}`
    );

    return chain;
};

/**
 * Sanitize boolean
 */
const sanitizeBoolean = (field, options = {}) => {
    const { optional = false } = options;

    let chain = body(field).toBoolean();

    if (!optional) {
        chain = chain.isBoolean().withMessage(`${field} must be a boolean`);
    } else {
        chain = chain.optional().isBoolean().withMessage(`${field} must be a boolean`);
    }

    return chain;
};

/**
 * Sanitize date (ISO 8601 format)
 */
const sanitizeDate = (field, options = {}) => {
    const { optional = false } = options;

    let chain = body(field).toDate();

    if (!optional) {
        chain = chain.isISO8601().withMessage(`${field} must be a valid ISO 8601 date`);
    } else {
        chain = chain.optional().isISO8601().withMessage(`${field} must be a valid ISO 8601 date`);
    }

    return chain;
};

/**
 * Sanitize CUID
 */
const sanitizeCuid = (field, options = {}) => {
    const { optional = false } = options;

    let chain = body(field)
        .trim()
        .matches(/^c[a-z0-9]{24}$/)
        .withMessage(`${field} must be a valid CUID`);

    if (optional) {
        chain = chain.optional();
    }

    return chain;
};

/**
 * Sanitize array
 */
const sanitizeArray = (field, options = {}) => {
    const { optional = false, minLength, maxLength } = options;

    let chain = body(field);

    if (!optional) {
        chain = chain.notEmpty().withMessage(`${field} is required`);
    }

    chain = chain.isArray().withMessage(`${field} must be an array`);

    if (minLength !== undefined) {
        chain = chain.isLength({ min: minLength }).withMessage(`${field} must have at least ${minLength} items`);
    }

    if (maxLength !== undefined) {
        chain = chain.isLength({ max: maxLength }).withMessage(`${field} must have at most ${maxLength} items`);
    }

    return chain;
};

/**
 * Sanitize URL
 */
const sanitizeUrl = (field, options = {}) => {
    const { optional = false, protocols = ['http', 'https'] } = options;

    let chain = body(field)
        .trim()
        .isURL({ protocols })
        .withMessage(`${field} must be a valid URL`);

    if (optional) {
        chain = chain.optional();
    }

    return chain;
};

/**
 * Pre-configured sanitization chains for common use cases
 */
const sanitizers = {
    // Generic
    handleErrors,

    // Field types
    string: sanitizeString,
    email: sanitizeEmail,
    phone: sanitizePhone,
    number: sanitizeNumber,
    integer: sanitizeInteger,
    boolean: sanitizeBoolean,
    date: sanitizeDate,
    cuid: sanitizeCuid,
    array: sanitizeArray,
    url: sanitizeUrl,

    // Common patterns
    name: (field) => sanitizeString(field, { minLength: 1, maxLength: 100 }),
    password: (field) => body(field).isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    description: (field) => sanitizeString(field, { optional: true, maxLength: 1000 }),
    positiveNumber: (field) => sanitizeNumber(field, { min: 0 }),
    positiveInteger: (field) => sanitizeInteger(field, { min: 0 }),
};

module.exports = sanitizers;
