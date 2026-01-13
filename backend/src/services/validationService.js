const ApiError = require('../utils/ApiError');

/**
 * Validation Service for Salt Mappings
 * 
 * Validates salt mappings, strength values, and image uploads.
 * Validates: Requirements 4.6, 12.1, 12.2, 12.4, 12.5, 2.1
 */
class ValidationService {
    /**
     * Validate salt mapping before activation
     * @param {Object} saltMapping - Salt mapping data
     * @param {Array} saltMapping.salts - Array of salt entries
     * @returns {Object} Validation result
     */
    validateSaltMapping(saltMapping) {
        const errors = [];
        const warnings = [];

        if (!saltMapping || !saltMapping.salts) {
            errors.push('Salt mapping data is required');
            return { valid: false, errors, warnings };
        }

        const { salts } = saltMapping;

        // Rule 1: At least one salt must be present
        if (!Array.isArray(salts) || salts.length === 0) {
            errors.push('At least one salt is required to activate medicine');
        }

        if (salts.length > 0) {
            const saltIds = new Set();

            salts.forEach((salt, index) => {
                // Rule 2: Strength value requires unit
                if (salt.strengthValue !== null && salt.strengthValue !== undefined) {
                    if (!salt.strengthUnit || salt.strengthUnit.trim() === '') {
                        errors.push(`Salt ${index + 1}: Strength unit is required when value is provided`);
                    }

                    // Rule 3: Strength value range validation
                    if (salt.strengthValue <= 0) {
                        errors.push(`Salt ${index + 1}: Strength value must be greater than 0`);
                    }

                    if (salt.strengthValue > 10000) {
                        warnings.push(`Salt ${index + 1}: Strength value (${salt.strengthValue}) seems unusually high`);
                    }
                }

                // Rule 4: Check for duplicate salts
                if (salt.saltId) {
                    if (saltIds.has(salt.saltId)) {
                        errors.push(`Duplicate salt detected: ${salt.name || salt.saltId}`);
                    }
                    saltIds.add(salt.saltId);
                }

                // Validate salt name
                if (!salt.name || salt.name.trim() === '') {
                    errors.push(`Salt ${index + 1}: Salt name is required`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate image upload
     * @param {Object} file - File object or file metadata
     * @returns {Object} Validation result
     */
    validateImage(file) {
        const errors = [];
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        const MIN_WIDTH = 800;
        const MIN_HEIGHT = 600;
        const VALID_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!file) {
            errors.push('Image file is required');
            return { valid: false, errors };
        }

        // Check file size
        if (file.size && file.size > MAX_SIZE) {
            errors.push(`Image size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 5MB`);
        }

        // Check file format
        if (file.mimetype || file.type) {
            const mimeType = file.mimetype || file.type;
            if (!VALID_FORMATS.includes(mimeType)) {
                errors.push(`Invalid image format. Supported formats: JPG, PNG, WEBP`);
            }
        }

        // Check dimensions (if available)
        if (file.width && file.height) {
            if (file.width < MIN_WIDTH || file.height < MIN_HEIGHT) {
                errors.push(`Image resolution (${file.width}x${file.height}) is too low. Minimum: ${MIN_WIDTH}x${MIN_HEIGHT}`);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate bulk update data
     * @param {Array} updates - Array of update objects
     * @returns {Object} Validation result
     */
    validateBulkUpdate(updates) {
        const errors = [];

        if (!Array.isArray(updates)) {
            errors.push('Updates must be an array');
            return { valid: false, errors };
        }

        if (updates.length === 0) {
            errors.push('At least one update is required');
            return { valid: false, errors };
        }

        updates.forEach((update, index) => {
            if (!update.drugId) {
                errors.push(`Update ${index + 1}: Drug ID is required`);
            }

            if (update.salts) {
                const saltValidation = this.validateSaltMapping({ salts: update.salts });
                if (!saltValidation.valid) {
                    errors.push(`Update ${index + 1}: ${saltValidation.errors.join(', ')}`);
                }
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate medicine activation
     * @param {Object} drug - Drug object with salt links
     * @returns {Object} Validation result
     */
    validateActivation(drug) {
        const errors = [];

        if (!drug) {
            errors.push('Drug data is required');
            return { valid: false, errors };
        }

        // Check if drug has salt links
        if (!drug.drugSaltLinks || drug.drugSaltLinks.length === 0) {
            errors.push('Cannot activate medicine without salt composition. Please add at least one salt.');
        }

        // Validate each salt link
        if (drug.drugSaltLinks && drug.drugSaltLinks.length > 0) {
            const saltValidation = this.validateSaltMapping({
                salts: drug.drugSaltLinks.map(link => ({
                    saltId: link.saltId,
                    name: link.salt?.name,
                    strengthValue: link.strengthValue,
                    strengthUnit: link.strengthUnit
                }))
            });

            if (!saltValidation.valid) {
                errors.push(...saltValidation.errors);
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate import data
     * @param {Array} importData - Array of medicine data to import
     * @returns {Object} Validation result with details per record
     */
    validateImport(importData) {
        if (!Array.isArray(importData)) {
            return {
                valid: false,
                errors: ['Import data must be an array'],
                validRecords: [],
                invalidRecords: []
            };
        }

        const validRecords = [];
        const invalidRecords = [];

        importData.forEach((record, index) => {
            const recordErrors = [];

            // Required fields
            if (!record.name || record.name.trim() === '') {
                recordErrors.push('Medicine name is required');
            }

            if (!record.storeId) {
                recordErrors.push('Store ID is required');
            }

            // Optional salt mapping validation
            if (record.salts && Array.isArray(record.salts)) {
                const saltValidation = this.validateSaltMapping({ salts: record.salts });
                if (!saltValidation.valid) {
                    recordErrors.push(...saltValidation.errors);
                }
            }

            if (recordErrors.length > 0) {
                invalidRecords.push({
                    index,
                    record,
                    errors: recordErrors
                });
            } else {
                validRecords.push(record);
            }
        });

        return {
            valid: invalidRecords.length === 0,
            errors: invalidRecords.length > 0 ? [`${invalidRecords.length} invalid records found`] : [],
            validRecords,
            invalidRecords
        };
    }
}

module.exports = new ValidationService();
