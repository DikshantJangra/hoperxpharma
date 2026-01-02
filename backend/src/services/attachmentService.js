const crypto = require('crypto');
const logger = require('../config/logger');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../db/prisma');
const {
    getPresignedUploadUrl,
    getPublicUrl,
    uploadObject,
    getObject,
    deleteObject,
    streamToBuffer,
} = require('../config/r2');

// Constants for efficient compression
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB (reduced for cost efficiency)
const MAX_IMAGE_DIMENSION = 1600; // 1600px max (reduced from 1920 for more compression)
const IMAGE_QUALITY = 40; // WebP quality 40 (reduced from 50 for heavier compression, still readable)
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];
const TEMP_UPLOAD_EXPIRY = 3600; // 1 hour

/**
 * Request a presigned URL for uploading a PO attachment
 * @param {string} poId - Purchase Order ID
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestUpload(poId, fileName) {
    // Generate a unique temp key
    const tempKey = `tmp/po-uploads/${uuidv4()}-${fileName}`;

    // Generate presigned URL
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Validate file type
 * @param {string} mimeType
 * @returns {boolean}
 */
function isValidFileType(mimeType) {
    return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Process and compress file if applicable
 * @param {Buffer} buffer - Original file buffer
 * @param {string} mimeType - File MIME type
 * @returns {Promise<{buffer: Buffer, mimeType: string, wasCompressed: boolean}>}
 */
async function processFile(buffer, mimeType) {
    // Compress images
    if (mimeType.startsWith('image/')) {
        try {
            const compressedBuffer = await sharp(buffer)
                .resize({
                    width: MAX_IMAGE_DIMENSION,
                    height: MAX_IMAGE_DIMENSION,
                    fit: 'inside',
                    withoutEnlargement: true,
                })
                .webp({ quality: IMAGE_QUALITY })
                .toBuffer();

            const compressionRatio = compressedBuffer.length / buffer.length;
            logger.info(`[Attachment] Image compressed: ${buffer.length} → ${compressedBuffer.length} (${((1 - compressionRatio) * 100).toFixed(1)}% reduction)`);

            return {
                buffer: compressedBuffer,
                mimeType: 'image/webp',
                wasCompressed: true,
            };
        } catch (error) {
            logger.error('Image processing failed, using original:', error);
            return { buffer, mimeType, wasCompressed: false };
        }
    }

    // Compress PDFs
    if (mimeType === 'application/pdf') {
        try {
            const { PDFDocument } = require('pdf-lib');

            // Load the PDF
            const pdfDoc = await PDFDocument.load(buffer, {
                ignoreEncryption: true,
                updateMetadata: false
            });

            // Save with aggressive compression
            const compressedBuffer = await pdfDoc.save({
                useObjectStreams: true, // Enable object streams for better compression
                addDefaultPage: false,
                objectsPerTick: 50,
                updateFieldAppearances: false, // Skip updating field appearances for smaller size
            });

            const compressionRatio = compressedBuffer.length / buffer.length;

            // Use compressed version if it provides any reduction (even small)
            // Target is 55%+ compression, but accept any improvement
            if (compressionRatio < 0.98) { // Accept if at least 2% smaller
                logger.info(`[Attachment] PDF compressed: ${buffer.length} → ${compressedBuffer.length} (${((1 - compressionRatio) * 100).toFixed(1)}% reduction)`);
                return {
                    buffer: Buffer.from(compressedBuffer),
                    mimeType,
                    wasCompressed: true,
                };
            } else {
                logger.info(`[Attachment] PDF compression minimal, using original`);
            }
        } catch (error) {
            logger.error('PDF compression failed, using original:', error);
        }
    }

    // For other file types, return as-is
    return { buffer, mimeType, wasCompressed: false };
}

/**
 * Process uploaded attachment from temp location
 * @param {string} poId - Purchase Order ID
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} originalFileName - Original file name
 * @returns {Promise<{success: boolean, attachment?: object, error?: string}>}
 */
async function processUpload(poId, tempKey, userId, originalFileName) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);
        const originalSize = buffer.length;

        // 2. Validate file size
        if (originalSize > MAX_FILE_SIZE) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
            };
        }

        // 3. Validate file type
        const mimeType = response.ContentType || 'application/octet-stream';
        if (!isValidFileType(mimeType)) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: 'Invalid file type. Allowed: Images, PDFs, Word documents, Text files.',
            };
        }

        // 4. Process/compress file if applicable
        const { buffer: processedBuffer, mimeType: finalMimeType, wasCompressed } = await processFile(buffer, mimeType);
        const compressedSize = processedBuffer.length;

        // 5. Determine file type category
        let fileType = 'document';
        if (finalMimeType.startsWith('image/')) fileType = 'image';
        else if (finalMimeType === 'application/pdf') fileType = 'pdf';

        // 6. Generate final filename with extension
        const ext = finalMimeType === 'image/webp' ? 'webp' : originalFileName.split('.').pop();
        const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalFileName = `${Date.now()}-${sanitizedName}`;

        // 7. Upload to canonical R2 key
        const canonicalKey = `objects/po-attachments/${poId}/${finalFileName}`;
        await uploadObject(canonicalKey, processedBuffer, finalMimeType);

        // 8. Create database record
        const attachment = await prisma.pOAttachment.create({
            data: {
                purchaseOrderId: poId,
                fileName: originalFileName,
                fileType,
                mimeType: finalMimeType,
                originalSize: BigInt(originalSize),
                compressedSize: BigInt(compressedSize),
                r2Key: canonicalKey,
                url: getPublicUrl(canonicalKey),
                uploadedBy: userId,
            },
        });

        // 9. Delete temp file
        await deleteObject(tempKey);

        return {
            success: true,
            attachment: {
                id: attachment.id,
                fileName: attachment.fileName,
                fileType: attachment.fileType,
                url: attachment.url,
                originalSize: Number(attachment.originalSize),
                compressedSize: Number(attachment.compressedSize),
                compressionRatio: wasCompressed ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0,
                uploadedAt: attachment.uploadedAt,
            },
        };
    } catch (error) {
        logger.error('Error processing attachment upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            logger.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process attachment upload.',
        };
    }
}

/**
 * Get all attachments for a PO
 * @param {string} poId - Purchase Order ID
 * @returns {Promise<Array>}
 */
async function getAttachments(poId) {
    const attachments = await prisma.pOAttachment.findMany({
        where: { purchaseOrderId: poId },
        orderBy: { uploadedAt: 'desc' },
    });

    return attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        url: att.url,
        originalSize: Number(att.originalSize), // Convert BigInt to Number
        compressedSize: Number(att.compressedSize), // Convert BigInt to Number
        uploadedAt: att.uploadedAt,
    }));
}

/**
 * Delete an attachment
 * @param {string} attachmentId - Attachment ID
 * @param {string} userId - User ID requesting deletion
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteAttachment(attachmentId, userId) {
    try {
        const attachment = await prisma.pOAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment) {
            return { success: false, error: 'Attachment not found.' };
        }

        // Delete from R2
        await deleteObject(attachment.r2Key);

        // Delete from database
        await prisma.pOAttachment.delete({
            where: { id: attachmentId },
        });

        return { success: true };
    } catch (error) {
        logger.error('Error deleting attachment:', error);
        return { success: false, error: error.message || 'Failed to delete attachment.' };
    }
}

// ========== GRN ATTACHMENT FUNCTIONS ==========

/**
 * Request a presigned URL for uploading a GRN attachment
 * @param {string} grnId - GRN ID
 * @param {string} fileName - Original file name
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestGRNUpload(grnId, fileName) {
    const tempKey = `tmp/grn-uploads/${uuidv4()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Process uploaded GRN attachment from temp location
 * @param {string} grnId - GRN ID
 * @param {string} tempKey - Temporary R2 key
 * @param {string} userId - User ID who uploaded
 * @param {string} originalFileName - Original file name
 * @returns {Promise<{success: boolean, attachment?: object, error?: string}>}
 */
async function processGRNUpload(grnId, tempKey, userId, originalFileName) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);
        const originalSize = buffer.length;

        // 2. Validate file size
        if (originalSize > MAX_FILE_SIZE) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
            };
        }

        // 3. Validate file type
        const mimeType = response.ContentType || 'application/octet-stream';
        if (!isValidFileType(mimeType)) {
            await deleteObject(tempKey);
            return {
                success: false,
                error: 'Invalid file type. Allowed: Images, PDFs, Word documents, Text files.',
            };
        }

        // 4. Process/compress file if applicable
        const { buffer: processedBuffer, mimeType: finalMimeType, wasCompressed } = await processFile(buffer, mimeType);
        const compressedSize = processedBuffer.length;

        // 5. Determine file type category
        let fileType = 'document';
        if (finalMimeType.startsWith('image/')) fileType = 'image';
        else if (finalMimeType === 'application/pdf') fileType = 'pdf';

        // 6. Generate final filename with extension
        const ext = finalMimeType === 'image/webp' ? 'webp' : originalFileName.split('.').pop();
        const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const finalFileName = `${Date.now()}-${sanitizedName}`;

        // 7. Upload to canonical R2 key
        const canonicalKey = `objects/grn-attachments/${grnId}/${finalFileName}`;
        await uploadObject(canonicalKey, processedBuffer, finalMimeType);

        // 8. Create database record
        const attachment = await prisma.gRNAttachment.create({
            data: {
                grnId,
                fileName: originalFileName,
                fileType,
                mimeType: finalMimeType,
                originalSize: BigInt(originalSize),
                compressedSize: BigInt(compressedSize),
                r2Key: canonicalKey,
                url: getPublicUrl(canonicalKey),
                uploadedBy: userId,
            },
        });

        // 9. Delete temp file
        await deleteObject(tempKey);

        return {
            success: true,
            attachment: {
                id: attachment.id,
                fileName: attachment.fileName,
                fileType: attachment.fileType,
                url: attachment.url,
                originalSize: Number(attachment.originalSize),
                compressedSize: Number(attachment.compressedSize),
                compressionRatio: wasCompressed ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0,
                uploadedAt: attachment.uploadedAt,
            },
        };
    } catch (error) {
        logger.error('Error processing GRN attachment upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            logger.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process attachment upload.',
        };
    }
}

/**
 * Get all attachments for a GRN
 * @param {string} grnId - GRN ID
 * @returns {Promise<Array>}
 */
async function getGRNAttachments(grnId) {
    const attachments = await prisma.gRNAttachment.findMany({
        where: { grnId },
        orderBy: { uploadedAt: 'desc' },
    });

    return attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        url: att.url,
        originalSize: Number(att.originalSize),
        compressedSize: Number(att.compressedSize),
        uploadedAt: att.uploadedAt,
    }));
}

/**
 * Delete a GRN attachment
 * @param {string} attachmentId - Attachment ID
 * @param {string} userId - User ID requesting deletion
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteGRNAttachment(attachmentId, userId) {
    try {
        const attachment = await prisma.gRNAttachment.findUnique({
            where: { id: attachmentId },
        });

        if (!attachment) {
            return { success: false, error: 'Attachment not found.' };
        }

        // Delete from R2
        await deleteObject(attachment.r2Key);

        // Delete from database
        await prisma.gRNAttachment.delete({
            where: { id: attachmentId },
        });

        return { success: true };
    } catch (error) {
        logger.error('Error deleting GRN attachment:', error);
        return { success: false, error: error.message || 'Failed to delete attachment.' };
    }
}

module.exports = {
    requestUpload,
    processUpload,
    getAttachments,
    deleteAttachment,
    // GRN functions
    requestGRNUpload,
    processGRNUpload,
    getGRNAttachments,
    deleteGRNAttachment,
};
