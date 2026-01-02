const crypto = require('crypto');
const logger = require('../../config/logger');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../db/prisma');
const {
    getPresignedUploadUrl,
    getPublicUrl,
    uploadObject,
    getObject,
    deleteObject,
    streamToBuffer,
} = require('../../config/r2');

// Constants for asset compression
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_LOGO_DIMENSION = 800; // 800px max for logos
const MAX_SIGNATURE_DIMENSION = 600; // 600px max for signatures
const IMAGE_QUALITY = 85; // WebP quality
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TEMP_UPLOAD_EXPIRY = 3600; // 1 hour

/**
 * Request a presigned URL for uploading a store logo
 * @param {string} storeId - Store ID
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestLogoUpload(storeId, fileName) {
    const tempKey = `tmp/store-assets/${storeId}/logo/${uuidv4()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Request a presigned URL for uploading a store signature
 * @param {string} storeId - Store ID
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestSignatureUpload(storeId, fileName) {
    const tempKey = `tmp/store-assets/${storeId}/signature/${uuidv4()}-${fileName}`;
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
        logger.info(`[StoreAsset] Image compressed: ${buffer.length} → ${compressedBuffer.length} (${((1 - compressionRatio) * 100).toFixed(1)}% reduction)`);

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
 * Process uploaded logo from temp location
 * @param {string} storeId - Store ID
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} originalFileName - Original file name
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function processLogoUpload(storeId, tempKey, userId, originalFileName) {
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

        // 5. Generate final filename
        const finalFileName = `logo-${Date.now()}.webp`;

        // 6. Delete old logo if exists
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { logoUrl: true },
        });

        if (store?.logoUrl) {
            // Extract R2 key from URL and delete
            try {
                const oldKey = store.logoUrl.split('.com/')[1];
                if (oldKey) {
                    await deleteObject(oldKey);
                }
            } catch (err) {
                logger.warn('Failed to delete old logo:', err);
            }
        }

        // 7. Upload to canonical R2 key
        const canonicalKey = `objects/store-assets/${storeId}/logo/${finalFileName}`;
        await uploadObject(canonicalKey, processedBuffer, finalMimeType);

        // 8. Update store record
        const publicUrl = getPublicUrl(canonicalKey);
        await prisma.store.update({
            where: { id: storeId },
            data: { logoUrl: publicUrl },
        });

        // 9. Delete temp file
        await deleteObject(tempKey);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        logger.error('Error processing logo upload:', error);

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

/**
 * Process uploaded signature from temp location
 * @param {string} storeId - Store ID
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} originalFileName - Original file name
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
async function processSignatureUpload(storeId, tempKey, userId, originalFileName) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);
        const originalSize = buffer.length;

        // 2. Validate file size
        if (originalSize > MAX_SIGNATURE_SIZE) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: `Signature size exceeds maximum allowed size of ${MAX_SIGNATURE_SIZE / 1024 / 1024} MB.`,
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
            MAX_SIGNATURE_DIMENSION,
            IMAGE_QUALITY
        );

        // 5. Generate final filename
        const finalFileName = `signature-${Date.now()}.webp`;

        // 6. Delete old signature if exists
        const store = await prisma.store.findUnique({
            where: { id: storeId },
            select: { signatureUrl: true },
        });

        if (store?.signatureUrl) {
            // Extract R2 key from URL and delete
            try {
                const oldKey = store.signatureUrl.split('.com/')[1];
                if (oldKey) {
                    await deleteObject(oldKey);
                }
            } catch (err) {
                logger.warn('Failed to delete old signature:', err);
            }
        }

        // 7. Upload to canonical R2 key
        const canonicalKey = `objects/store-assets/${storeId}/signature/${finalFileName}`;
        await uploadObject(canonicalKey, processedBuffer, finalMimeType);

        // 8. Update store record
        const publicUrl = getPublicUrl(canonicalKey);
        await prisma.store.update({
            where: { id: storeId },
            data: { signatureUrl: publicUrl },
        });

        // 9. Delete temp file
        await deleteObject(tempKey);

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        logger.error('Error processing signature upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            logger.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process signature upload.',
        };
    }
}

module.exports = {
    requestLogoUpload,
    processLogoUpload,
    requestSignatureUpload,
    processSignatureUpload,
};
