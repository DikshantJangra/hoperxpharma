const crypto = require('crypto');
const logger = require('../../config/logger');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const {
    getPresignedUploadUrl,
    getPublicUrl,
    uploadObject,
    getObject,
    deleteObject,
    streamToBuffer,
    copyObject
} = require('../../config/r2');

// Constants for asset compression (Mirrors storeAssetService)
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_LOGO_DIMENSION = 800; // 800px max for logos
const IMAGE_QUALITY = 85; // WebP quality
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TEMP_UPLOAD_EXPIRY = 3600; // 1 hour

/**
 * Request a presigned URL for uploading an onboarding logo
 * @param {string} userId - User ID
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestLogoUpload(userId, fileName) {
    // Use a user-specific temp path
    const tempKey = `tmp/onboarding/${userId}/logo/${uuidv4()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Validate image file type
 * @param {string} mimeType
 * @returns {boolean}
 */
function isValidImageType(mimeType) {
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Process and compress image
 * @param {Buffer} buffer - Original image buffer
 * @param {string} mimeType - Image MIME type
 * @param {number} maxDimension - Maximum dimension (width/height)
 * @param {number} quality - WebP quality (0-100)
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
async function processImage(buffer, mimeType, maxDimension, quality) {
    try {
        const compressedBuffer = await sharp(buffer)
            .resize({
                width: maxDimension,
                height: maxDimension,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality })
            .toBuffer();

        const compressionRatio = compressedBuffer.length / buffer.length;
        logger.info(`[OnboardingAsset] Image compressed: ${buffer.length} -> ${compressedBuffer.length} (${((1 - compressionRatio) * 100).toFixed(1)}% reduction)`);

        return {
            buffer: compressedBuffer,
            mimeType: 'image/webp',
        };
    } catch (error) {
        logger.error('Image processing failed:', error);
        throw new Error('Failed to process image');
    }
}

/**
 * Process uploaded logo from temp location for onboarding
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} originalFileName - Original file name
 * @returns {Promise<{success: boolean, url?: string, error?: string, processedKey?: string}>}
 */
async function processLogoUpload(tempKey, userId, originalFileName) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);
        const originalSize = buffer.length;

        // 2. Validate file size
        if (originalSize > MAX_LOGO_SIZE) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: `Logo size exceeds maximum allowed size of ${MAX_LOGO_SIZE / 1024 / 1024} MB.`,
            };
        }

        // 3. Validate file type
        const mimeType = response.ContentType || 'application/octet-stream';
        if (!isValidImageType(mimeType)) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
            };
        }

        // 4. Process/compress image
        const { buffer: processedBuffer, mimeType: finalMimeType } = await processImage(
            buffer,
            mimeType,
            MAX_LOGO_DIMENSION,
            IMAGE_QUALITY
        );

        // 5. Generate final filename (still temp/onboarding but processed)
        const finalFileName = `logo-processed-${Date.now()}.webp`;
        // Keep it in user's temp folder but mark as processed
        const processedKey = `tmp/onboarding/${userId}/logo/${finalFileName}`;

        // 6. Upload processed image to the new temp location
        await uploadObject(processedKey, processedBuffer, finalMimeType);

        // 7. Delete original temp file
        await deleteObject(tempKey);

        const publicUrl = getPublicUrl(processedKey);

        return {
            success: true,
            url: publicUrl,
            processedKey: processedKey // Return this so we can move it later
        };
    } catch (error) {
        logger.error('Error processing onboarding logo upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            logger.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process logo upload.',
        };
    }
}

module.exports = {
    requestLogoUpload,
    processLogoUpload,
    requestLicenseUpload,
    processLicenseUpload,
};

// ============================================================================
// License Document Upload Functions
// ============================================================================

const MAX_LICENSE_SIZE = 10 * 1024 * 1024; // 10 MB for documents
const MAX_LICENSE_DIMENSION = 1200; // 1200px max for license documents
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/**
 * Request a presigned URL for uploading a license document
 * @param {string} userId - User ID
 * @param {string} licenseType - Type of license ('DRUG_LICENSE' or 'GST_CERTIFICATE')
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestLicenseUpload(userId, licenseType, fileName) {
    const sanitizedType = licenseType.toLowerCase().replace(/_/g, '-');
    const tempKey = `tmp/onboarding/${userId}/license/${sanitizedType}-${uuidv4()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Validate document file type (images + PDF)
 * @param {string} mimeType
 * @returns {boolean}
 */
function isValidDocType(mimeType) {
    return ALLOWED_DOC_TYPES.includes(mimeType);
}

/**
 * Process uploaded license document from temp location
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} licenseType - Type of license
 * @returns {Promise<{success: boolean, url?: string, error?: string, processedKey?: string}>}
 */
async function processLicenseUpload(tempKey, userId, licenseType) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);
        const originalSize = buffer.length;

        // 2. Validate file size
        if (originalSize > MAX_LICENSE_SIZE) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: `Document size exceeds maximum allowed size of ${MAX_LICENSE_SIZE / 1024 / 1024} MB.`,
            };
        }

        // 3. Validate file type
        const mimeType = response.ContentType || 'application/octet-stream';
        if (!isValidDocType(mimeType)) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.',
            };
        }

        const sanitizedType = licenseType.toLowerCase().replace(/_/g, '-');
        let processedBuffer = buffer;
        let finalMimeType = mimeType;
        let extension = mimeType === 'application/pdf' ? 'pdf' : 'webp';

        // 4. If it's an image, compress it
        if (mimeType !== 'application/pdf') {
            const result = await processImage(buffer, mimeType, MAX_LICENSE_DIMENSION, IMAGE_QUALITY);
            processedBuffer = result.buffer;
            finalMimeType = result.mimeType;
            extension = 'webp';
        }

        // 5. Generate final filename
        const finalFileName = `${sanitizedType}-${Date.now()}.${extension}`;
        const processedKey = `tmp/onboarding/${userId}/license/${finalFileName}`;

        // 6. Upload processed document
        await uploadObject(processedKey, processedBuffer, finalMimeType);

        // 7. Delete original temp file
        await deleteObject(tempKey);

        const publicUrl = getPublicUrl(processedKey);

        logger.info(`[OnboardingAsset] License document processed: ${originalSize} -> ${processedBuffer.length} bytes`);

        return {
            success: true,
            url: publicUrl,
            processedKey: processedKey
        };
    } catch (error) {
        logger.error('Error processing license document upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            logger.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process license document upload.',
        };
    }
}
