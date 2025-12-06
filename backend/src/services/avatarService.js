const crypto = require('crypto');
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

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 256; // 256x256 pixels (reduced from 512 for efficiency)
const WEBP_QUALITY = 50; // Quality 50 (optimized for small file size, still good quality)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const TEMP_UPLOAD_EXPIRY = 3600; // 1 hour

/**
 * Request a presigned URL for uploading an avatar
 * @param {string} userId - User ID
 * @returns {Promise<{uploadUrl: string, tempKey: string, expiresIn: number}>}
 */
async function requestUpload(userId) {
    // Generate a unique temp key
    const tempKey = `tmp/uploads/${uuidv4()}`;

    // Generate presigned URL
    const uploadUrl = await getPresignedUploadUrl(tempKey, TEMP_UPLOAD_EXPIRY);

    return {
        uploadUrl,
        tempKey,
        expiresIn: TEMP_UPLOAD_EXPIRY,
    };
}

/**
 * Compute SHA256 hash of a buffer
 * @param {Buffer} buffer
 * @returns {string} Hex-encoded hash
 */
function computeSHA256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate image format and metadata
 * @param {Buffer} buffer
 * @returns {Promise<{isValid: boolean, metadata?: object, error?: string}>}
 */
async function validateImage(buffer) {
    try {
        const metadata = await sharp(buffer).metadata();

        // Check if it's a valid image format
        if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
            return {
                isValid: false,
                error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.',
            };
        }

        return { isValid: true, metadata };
    } catch (error) {
        return { isValid: false, error: 'Invalid or corrupted image file.' };
    }
}

/**
 * Process and optimize image
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<Buffer>} Optimized WebP buffer
 */
async function processImage(buffer) {
    return await sharp(buffer)
        .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'cover',
            position: 'center',
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
}

/**
 * Process uploaded avatar from temp location
 * @param {string} userId - User ID
 * @param {string} tempKey - Temporary R2 key
 * @returns {Promise<{success: boolean, avatarUrl?: string, sha?: string, error?: string}>}
 */
async function processUpload(userId, tempKey) {
    try {
        // 1. Fetch temp object from R2
        const response = await getObject(tempKey);
        const buffer = await streamToBuffer(response.Body);

        // 2. Validate file size
        if (buffer.length > MAX_FILE_SIZE) {
            await deleteObject(tempKey); // Clean up temp file
            return {
                success: false,
                error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
            };
        }

        // 3. Validate image format
        const validation = await validateImage(buffer);
        if (!validation.isValid) {
            await deleteObject(tempKey); // Clean up temp file
            return { success: false, error: validation.error };
        }

        // 4. Compute SHA256 hash
        const sha = computeSHA256(buffer);

        // 5. Check if this avatar already exists (deduplication)
        const existingObject = await prisma.avatarObject.findUnique({
            where: { sha },
        });

        if (existingObject) {
            // Avatar already exists, just create user mapping
            await prisma.$transaction(async (tx) => {
                // Deactivate previous avatars
                await tx.userAvatar.updateMany({
                    where: { userId, isActive: true },
                    data: { isActive: false },
                });

                // Get the next version number
                const lastAvatar = await tx.userAvatar.findFirst({
                    where: { userId },
                    orderBy: { version: 'desc' },
                });
                const nextVersion = lastAvatar ? lastAvatar.version + 1 : 1;

                // Create new user avatar mapping
                await tx.userAvatar.create({
                    data: {
                        userId,
                        sha,
                        key: existingObject.key,
                        version: nextVersion,
                        isActive: true,
                    },
                });

                // Increment ref count
                await tx.avatarObject.update({
                    where: { sha },
                    data: { refCount: { increment: 1 } },
                });
            });

            // Delete temp file
            await deleteObject(tempKey);

            return {
                success: true,
                avatarUrl: getPublicUrl(existingObject.key),
                sha,
                reused: true,
            };
        }

        // 6. Process and optimize image
        const optimizedBuffer = await processImage(buffer);

        // 7. Upload to canonical key
        const canonicalKey = `objects/avatars/${sha}.webp`;
        await uploadObject(canonicalKey, optimizedBuffer, 'image/webp');

        // 8. Update database
        await prisma.$transaction(async (tx) => {
            // Deactivate previous avatars
            await tx.userAvatar.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
            });

            // Get the next version number
            const lastAvatar = await tx.userAvatar.findFirst({
                where: { userId },
                orderBy: { version: 'desc' },
            });
            const nextVersion = lastAvatar ? lastAvatar.version + 1 : 1;

            // Create avatar object
            await tx.avatarObject.create({
                data: {
                    sha,
                    key: canonicalKey,
                    sizeBytes: BigInt(optimizedBuffer.length),
                    refCount: 1,
                },
            });

            // Create user avatar mapping
            await tx.userAvatar.create({
                data: {
                    userId,
                    sha,
                    key: canonicalKey,
                    version: nextVersion,
                    isActive: true,
                },
            });
        });

        // 9. Delete temp file
        await deleteObject(tempKey);

        return {
            success: true,
            avatarUrl: getPublicUrl(canonicalKey),
            sha,
            reused: false,
        };
    } catch (error) {
        console.error('Error processing avatar upload:', error);

        // Try to clean up temp file
        try {
            await deleteObject(tempKey);
        } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
        }

        return {
            success: false,
            error: error.message || 'Failed to process avatar upload.',
        };
    }
}

/**
 * Get avatar URL for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, avatarUrl?: string, error?: string}>}
 */
async function getAvatarUrl(userId) {
    try {
        const userAvatar = await prisma.userAvatar.findFirst({
            where: { userId, isActive: true },
            orderBy: { uploadedAt: 'desc' },
        });

        if (!userAvatar) {
            return { success: false, error: 'No avatar found for this user.' };
        }

        return {
            success: true,
            avatarUrl: getPublicUrl(userAvatar.key),
        };
    } catch (error) {
        console.error('Error getting avatar URL:', error);
        return { success: false, error: 'Failed to retrieve avatar URL.' };
    }
}

/**
 * Delete user's avatar
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function deleteAvatar(userId) {
    try {
        await prisma.$transaction(async (tx) => {
            // Get active avatar
            const userAvatar = await tx.userAvatar.findFirst({
                where: { userId, isActive: true },
            });

            if (!userAvatar) {
                throw new Error('No active avatar found for this user.');
            }

            // Deactivate user avatar
            await tx.userAvatar.update({
                where: { id: userAvatar.id },
                data: { isActive: false },
            });

            // Decrement ref count
            const avatarObject = await tx.avatarObject.update({
                where: { sha: userAvatar.sha },
                data: { refCount: { decrement: 1 } },
            });

            // If ref count is 0, schedule for deletion (or delete immediately)
            if (avatarObject.refCount <= 0) {
                // Delete from R2
                await deleteObject(avatarObject.key);

                // Delete from database
                await tx.avatarObject.delete({
                    where: { sha: userAvatar.sha },
                });
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting avatar:', error);
        return { success: false, error: error.message || 'Failed to delete avatar.' };
    }
}

/**
 * Cleanup orphaned avatar objects (ref count = 0)
 * This should be run as a background job
 * @returns {Promise<{deleted: number}>}
 */
async function cleanupOrphans() {
    try {
        const orphans = await prisma.avatarObject.findMany({
            where: { refCount: { lte: 0 } },
        });

        for (const orphan of orphans) {
            try {
                // Delete from R2
                await deleteObject(orphan.key);

                // Delete from database
                await prisma.avatarObject.delete({
                    where: { sha: orphan.sha },
                });
            } catch (error) {
                console.error(`Error deleting orphan ${orphan.sha}:`, error);
            }
        }

        return { deleted: orphans.length };
    } catch (error) {
        console.error('Error cleaning up orphans:', error);
        return { deleted: 0 };
    }
}

module.exports = {
    requestUpload,
    processUpload,
    getAvatarUrl,
    deleteAvatar,
    cleanupOrphans,
};
