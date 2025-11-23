const { z } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        try {
            const data = req[source];
            const validated = schema.parse(data);
            req[source] = validated;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Zod errors are in the 'issues' property
                const zodErrors = error.issues || [];

                const formattedErrors = zodErrors.map((err) => ({
                    field: err.path ? err.path.join('.') : 'unknown',
                    message: err.message || 'Validation error',
                }));

                return next(
                    ApiError.unprocessableEntity(
                        `Validation failed: ${formattedErrors.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
                        formattedErrors
                    )
                );
            }
            next(error);
        }
    };
};

module.exports = validate;
