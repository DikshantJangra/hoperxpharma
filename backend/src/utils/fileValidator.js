const path = require('path');

/**
 * File Validation Utilities for Security
 * Protects against malicious file uploads
 */

/**
 * Sanitize filename to prevent path traversal and malicious characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    // Remove any directory paths
    let sanitized = path.basename(filename);

    // Remove any non-alphanumeric characters except dots, dashes, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Remove multiple consecutive dots (potential path traversal)
    sanitized = sanitized.replace(/\.{2,}/g, '.');

    // Limit filename length
    const maxLength = 255;
    if (sanitized.length > maxLength) {
        const ext = path.extname(sanitized);
        const name = path.basename(sanitized, ext);
        sanitized = name.substring(0, maxLength - ext.length) + ext;
    }

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized === '.') {
        sanitized = 'file_' + Date.now();
    }

    return sanitized;
}

/**
 * Magic number signatures for file type validation
 * These are the first bytes of various file formats
 */
const FILE_SIGNATURES = {
    // Images
    jpeg: {
        signatures: [
            [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
            [0xFF, 0xD8, 0xFF, 0xE1], // JPEG with EXIF
            [0xFF, 0xD8, 0xFF, 0xE2], // JPEG with Canon
            [0xFF, 0xD8, 0xFF, 0xE3], // JPEG
        ],
        extension: ['jpg', 'jpeg']
    },
    png: {
        signatures: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
        extension: ['png']
    },
    gif: {
        signatures: [
            [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
            [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
        ],
        extension: ['gif']
    },
    webp: {
        signatures: [[0x52, 0x49, 0x46, 0x46]], // RIFF (first 4 bytes)
        extension: ['webp']
    },
    // Documents
    pdf: {
        signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
        extension: ['pdf']
    },
};

/**
 * Validate file magic number (file signature)
 * @param {Buffer} buffer - File buffer
 * @param {string} expectedType - Expected file type (jpeg, png, pdf, etc.)
 * @returns {boolean} True if magic number matches
 */
function validateMagicNumber(buffer, expectedType) {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    const fileType = FILE_SIGNATURES[expectedType.toLowerCase()];
    if (!fileType) {
        console.warn(`Unknown file type for magic number validation: ${expectedType}`);
        return false;
    }

    // Check if any of the signatures match
    return fileType.signatures.some(signature => {
        return signature.every((byte, index) => buffer[index] === byte);
    });
}

/**
 * Validate if buffer contains a valid image file
 * @param {Buffer} buffer - File buffer
 * @returns {object} { valid: boolean, type: string | null }
 */
function isValidImageFile(buffer) {
    if (!buffer || buffer.length < 8) {
        return { valid: false, type: null };
    }

    // Check each image type
    for (const [type, config] of Object.entries(FILE_SIGNATURES)) {
        if (['jpeg', 'png', 'gif', 'webp'].includes(type)) {
            if (validateMagicNumber(buffer, type)) {
                return { valid: true, type };
            }
        }
    }

    return { valid: false, type: null };
}

/**
 * Validate if buffer contains a valid PDF file
 * @param {Buffer} buffer - File buffer
 * @returns {boolean} True if valid PDF
 */
function isValidPdfFile(buffer) {
    return validateMagicNumber(buffer, 'pdf');
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension (lowercase, without dot)
 */
function getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Validate file based on extension and magic number
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename
 * @param {string[]} allowedTypes - Allowed MIME types
 * @returns {object} { valid: boolean, error: string | null }
 */
function validateFile(buffer, filename, allowedTypes = []) {
    const extension = getFileExtension(filename);

    // Check if extension is allowed based on MIME type
    const allowedExtensions = [];
    allowedTypes.forEach(mimeType => {
        if (mimeType.startsWith('image/')) {
            allowedExtensions.push('jpg', 'jpeg', 'png', 'gif', 'webp');
        } else if (mimeType === 'application/pdf') {
            allowedExtensions.push('pdf');
        }
    });

    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension .${extension} is not allowed. Allowed: ${allowedExtensions.join(', ')}`
        };
    }

    // Validate magic number based on extension
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        const imageValidation = isValidImageFile(buffer);
        if (!imageValidation.valid) {
            return {
                valid: false,
                error: `File appears to be corrupted or is not a valid image file`
            };
        }

        // Check if the magic number type matches the extension
        const expectedType = extension === 'jpg' ? 'jpeg' : extension;
        if (imageValidation.type !== expectedType) {
            return {
                valid: false,
                error: `File extension .${extension} does not match file content (detected: ${imageValidation.type})`
            };
        }
    } else if (extension === 'pdf') {
        if (!isValidPdfFile(buffer)) {
            return {
                valid: false,
                error: 'File appears to be corrupted or is not a valid PDF file'
            };
        }
    }

    return { valid: true, error: null };
}

module.exports = {
    sanitizeFilename,
    validateMagicNumber,
    isValidImageFile,
    isValidPdfFile,
    validateFile,
    getFileExtension,
};
