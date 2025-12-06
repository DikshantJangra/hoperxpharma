const Joi = require('joi');

/**
 * Validation schema for complete upload request
 */
const completeUploadSchema = Joi.object({
    tempKey: Joi.string()
        .required()
        .pattern(/^tmp\/uploads\/[a-f0-9-]+$/)
        .messages({
            'string.empty': 'Temporary key is required.',
            'string.pattern.base': 'Invalid temporary key format.',
            'any.required': 'Temporary key is required.',
        }),
});

/**
 * Middleware to validate complete upload request
 */
function validateCompleteUpload(req, res, next) {
    const { error } = completeUploadSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message,
        });
    }

    next();
}

module.exports = {
    validateCompleteUpload,
};
