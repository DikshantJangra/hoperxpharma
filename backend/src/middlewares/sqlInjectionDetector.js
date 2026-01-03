const logger = require('../config/logger');

/**
 * SQL Injection Detection Middleware
 * Detects and blocks potential SQL injection attempts in request parameters
 */

// Common SQL injection patterns
const SQL_INJECTION_PATTERNS = [
    // SQL Keywords
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE|GRANT|REVOKE)\b)/i,

    // Union-based injection
    /(UNION.*SELECT)/i,
    /(UNION.*ALL.*SELECT)/i,

    // Comments (used to bypass validation)
    /(--|\#|\/\*|\*\/)/,

    // String manipulation
    /('|(;)|(\bOR\b.*=)|(\bAND\b.*=))/i,

    // Stacked queries
    /;.*(\bSELECT|\bINSERT|\bUPDATE|\bDELETE)/i,

    // Time-based blind injection
    /(SLEEP\(|BENCHMARK\(|WAITFOR)/i,

    // Boolean-based blind injection
    /(\b1=1\b)|(\b1=2\b)|(\bOR\s+1\s*=\s*1\b)|(\bAND\s+1\s*=\s*1\b)/i,

    // Hex encoding attempts
    /(0x[0-9a-f]+)/i,

    // Database-specific functions
    /(CHAR\(|CHR\(|ASCII\(|SUBSTRING\(|MID\(|USER\(\)|DATABASE\(\)|VERSION\(\))/i,
];

/**
 * Check if a value contains SQL injection patterns
 */
function containsSQLInjection(value) {
    if (typeof value !== 'string') return false;

    // Decode URL encoding first
    let decodedValue = value;
    try {
        decodedValue = decodeURIComponent(value);
    } catch (err) {
        // If decoding fails, use original value
    }

    // Check against all patterns
    for (const pattern of SQL_INJECTION_PATTERNS) {
        if (pattern.test(decodedValue)) {
            return true;
        }
    }

    return false;
}

/**
 * Recursively check object for SQL injection
 */
function checkValue(value, path = '') {
    if (value === null || value === undefined) {
        return null;
    }

    // Skip check for known safe HTML fields in email
    if (path.endsWith('bodyHtml') || path.endsWith('html') || path.endsWith('body')) {
        return null;
    }

    if (typeof value === 'string') {
        if (containsSQLInjection(value)) {
            return {
                path,
                value,
                detected: true
            };
        }
    } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const result = checkValue(value[i], `${path}[${i}]`);
            if (result) return result;
        }
    } else if (typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
            const result = checkValue(val, path ? `${path}.${key}` : key);
            if (result) return result;
        }
    }

    return null;
}

/**
 * SQL Injection Detection Middleware
 */
const detectSQLInjection = (req, res, next) => {
    // Skip for file uploads (multipart/form-data)
    if (req.is('multipart/form-data')) {
        return next();
    }

    // Skip for Google OAuth callback (contains complex URLs/Tokens that trigger false positives)
    if (req.originalUrl.includes('/auth/google/callback')) {
        return next();
    }

    // Check query parameters
    const queryResult = checkValue(req.query, 'query');
    if (queryResult) {
        logger.warn('Potential SQL injection detected in query params', {
            path: queryResult.path,
            value: queryResult.value,
            ip: req.ip,
            user: req.user?.id,
            method: req.method,
            url: req.originalUrl
        });

        return res.status(400).json({
            success: false,
            message: 'Invalid input detected. Your request has been logged.',
            error: 'INVALID_INPUT'
        });
    }

    // Check request body
    const bodyResult = checkValue(req.body, 'body');
    if (bodyResult) {
        logger.warn('Potential SQL injection detected in request body', {
            path: bodyResult.path,
            value: bodyResult.value,
            ip: req.ip,
            user: req.user?.id,
            method: req.method,
            url: req.originalUrl
        });

        return res.status(400).json({
            success: false,
            message: 'Invalid input detected. Your request has been logged.',
            error: 'INVALID_INPUT'
        });
    }

    // Check URL parameters
    const paramsResult = checkValue(req.params, 'params');
    if (paramsResult) {
        logger.warn('Potential SQL injection detected in URL params', {
            path: paramsResult.path,
            value: paramsResult.value,
            ip: req.ip,
            user: req.user?.id,
            method: req.method,
            url: req.originalUrl
        });

        return res.status(400).json({
            success: false,
            message: 'Invalid input detected. Your request has been logged.',
            error: 'INVALID_INPUT'
        });
    }

    // All checks passed
    next();
};

/**
 * Strict mode - also checks headers
 */
const detectSQLInjectionStrict = (req, res, next) => {
    // Run standard checks first
    detectSQLInjection(req, res, (err) => {
        if (err) return next(err);

        // Additional header checks
        const suspiciousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];

        for (const header of suspiciousHeaders) {
            const value = req.get(header);
            if (value && containsSQLInjection(value)) {
                logger.warn('Potential SQL injection detected in headers', {
                    header,
                    value,
                    ip: req.ip,
                    user: req.user?.id,
                    method: req.method,
                    url: req.originalUrl
                });

                return res.status(400).json({
                    success: false,
                    message: 'Invalid request headers detected.',
                    error: 'INVALID_HEADERS'
                });
            }
        }

        next();
    });
};

module.exports = {
    detectSQLInjection,
    detectSQLInjectionStrict,
    containsSQLInjection, // Export for testing
};
