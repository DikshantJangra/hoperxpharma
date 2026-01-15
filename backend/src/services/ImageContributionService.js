"use strict";
/**
 * ImageContributionService - Medicine Image Management
 *
 * Handles image uploads to Cloudflare R2, deduplication, and contribution workflow.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageContributionService = exports.ImageContributionService = void 0;
const client_1 = require("@prisma/client");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto = __importStar(require("crypto"));
const sharp = __importStar(require("sharp"));
const prisma = new client_1.PrismaClient();
// Cloudflare R2 configuration (S3-compatible)
const r2Client = new client_s3_1.S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || 'https://your-account-id.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'medicine-images';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://images.yourdomain.com';
class ImageContributionService {
    /**
     * Upload image to R2 with compression and deduplication
     * Requirements: 7.1, 7.2, 7.3, 7.6
     */
    async uploadImage(input) {
        const { canonicalId, storeId, imageType, file, mimeType } = input;
        // Compress image to WebP format (Requirements 7.6)
        const compressedBuffer = await this.compressImage(file);
        // Calculate content hash for deduplication (Requirements 7.3)
        const contentHash = this.calculateHash(compressedBuffer);
        // Check for duplicate
        const existingImage = await this.findDuplicateByHash(contentHash);
        if (existingImage) {
            return {
                imageId: existingImage.id,
                url: existingImage.url,
                contentHash,
                isDuplicate: true,
                existingImageId: existingImage.id,
            };
        }
        // Generate unique image ID
        const imageId = `img_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        // Determine storage path
        const path = `medicines/${canonicalId}/stores/${storeId}/${imageType.toLowerCase()}.webp`;
        // Upload to R2
        await this.uploadToR2(path, compressedBuffer, 'image/webp');
        // Generate public URL
        const url = `${R2_PUBLIC_URL}/${path}`;
        // Save metadata to database
        await prisma.medicineImage.create({
            data: {
                id: imageId,
                canonicalId,
                storeId,
                imageType,
                url,
                contentHash,
                isGlobal: false,
                fileSize: compressedBuffer.length,
                mimeType: 'image/webp',
            },
        });
        return {
            imageId,
            url,
            contentHash,
            isDuplicate: false,
        };
    }
    /**
     * Compress image to WebP format
     * Requirements: 7.6
     */
    async compressImage(buffer) {
        try {
            return await sharp.default(buffer)
                .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .webp({
                quality: 85,
                effort: 4,
            })
                .toBuffer();
        }
        catch (error) {
            console.error('Image compression error:', error);
            throw new Error('Failed to compress image');
        }
    }
    /**
     * Calculate SHA-256 hash of image content
     * Requirements: 7.3
     */
    calculateHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }
    /**
     * Upload buffer to Cloudflare R2
     * Requirements: 7.1
     */
    async uploadToR2(path, buffer, contentType) {
        try {
            await r2Client.send(new client_s3_1.PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: path,
                Body: buffer,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000', // 1 year cache
            }));
        }
        catch (error) {
            console.error('R2 upload error:', error);
            throw new Error('Failed to upload image to storage');
        }
    }
    /**
     * Find duplicate image by content hash
     * Requirements: 7.3
     */
    async findDuplicateByHash(contentHash) {
        return prisma.medicineImage.findFirst({
            where: { contentHash },
        });
    }
    /**
     * Contribute store image as global image
     * Requirements: 7.4
     */
    async contributeAsGlobal(imageId, storeId) {
        // Get image metadata
        const image = await prisma.medicineImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            return {
                success: false,
                message: 'Image not found',
            };
        }
        // Verify store owns the image
        if (image.storeId !== storeId) {
            return {
                success: false,
                message: 'Unauthorized: Image does not belong to this store',
            };
        }
        // Check if medicine already has a global image of this type
        const existingGlobal = await prisma.medicineImage.findFirst({
            where: {
                canonicalId: image.canonicalId,
                imageType: image.imageType,
                isGlobal: true,
            },
        });
        if (existingGlobal) {
            return {
                success: false,
                message: 'Medicine already has a global image of this type',
            };
        }
        // Copy image to global path
        const globalPath = `medicines/${image.canonicalId}/global/${image.imageType.toLowerCase()}.webp`;
        const storePath = `medicines/${image.canonicalId}/stores/${storeId}/${image.imageType.toLowerCase()}.webp`;
        try {
            // Get image from store path
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: storePath,
            });
            const response = await r2Client.send(getCommand);
            const buffer = await this.streamToBuffer(response.Body);
            // Upload to global path
            await this.uploadToR2(globalPath, buffer, 'image/webp');
            // Update database - mark as global
            await prisma.medicineImage.update({
                where: { id: imageId },
                data: {
                    isGlobal: true,
                    contributedBy: storeId,
                    contributedAt: new Date(),
                },
            });
            const globalUrl = `${R2_PUBLIC_URL}/${globalPath}`;
            return {
                success: true,
                message: 'Image successfully contributed as global',
                globalImageUrl: globalUrl,
            };
        }
        catch (error) {
            console.error('Contribution error:', error);
            return {
                success: false,
                message: 'Failed to contribute image',
            };
        }
    }
    /**
     * Get contribution status for an image
     */
    async getContributionStatus(imageId) {
        const image = await prisma.medicineImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            return null;
        }
        // Count how many stores use this medicine
        const usageCount = await prisma.storeOverlay.count({
            where: { canonicalId: image.canonicalId },
        });
        return {
            imageId: image.id,
            isGlobal: image.isGlobal,
            contributedBy: image.contributedBy || undefined,
            contributedAt: image.contributedAt || undefined,
            usageCount,
        };
    }
    /**
     * Get all images for a medicine
     * Requirements: 7.2
     */
    async getImagesForMedicine(canonicalId, storeId) {
        const where = { canonicalId };
        if (storeId) {
            // Return global images + store-specific images
            where.OR = [{ isGlobal: true }, { storeId }];
        }
        else {
            // Return only global images
            where.isGlobal = true;
        }
        return prisma.medicineImage.findMany({
            where,
            orderBy: [{ isGlobal: 'desc' }, { createdAt: 'desc' }],
        });
    }
    /**
     * Check if medicine needs global image contribution
     * Requirements: 7.4
     */
    async needsGlobalImageContribution(canonicalId, imageType) {
        const existingGlobal = await prisma.medicineImage.findFirst({
            where: {
                canonicalId,
                imageType,
                isGlobal: true,
            },
        });
        return !existingGlobal;
    }
    /**
     * Delete image
     */
    async deleteImage(imageId, storeId) {
        const image = await prisma.medicineImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            return false;
        }
        // Only allow deletion of store-owned images
        if (image.storeId !== storeId) {
            throw new Error('Unauthorized: Cannot delete images from other stores');
        }
        // Cannot delete global images
        if (image.isGlobal) {
            throw new Error('Cannot delete global images');
        }
        // Delete from database
        await prisma.medicineImage.delete({
            where: { id: imageId },
        });
        return true;
    }
    /**
     * Helper: Convert stream to buffer
     */
    async streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    /**
     * Get image statistics
     */
    async getImageStats() {
        const [totalImages, globalImages, storeImages, sizeData, uniqueHashes] = await Promise.all([
            prisma.medicineImage.count(),
            prisma.medicineImage.count({ where: { isGlobal: true } }),
            prisma.medicineImage.count({ where: { isGlobal: false } }),
            prisma.medicineImage.aggregate({
                _sum: { fileSize: true },
            }),
            prisma.medicineImage.groupBy({
                by: ['contentHash'],
                _count: true,
            }),
        ]);
        // Calculate deduplication savings
        const duplicateCount = uniqueHashes.filter((h) => h._count > 1).length;
        const avgFileSize = (sizeData._sum.fileSize || 0) / (totalImages || 1);
        const deduplicationSavings = duplicateCount * avgFileSize;
        return {
            totalImages,
            globalImages,
            storeImages,
            totalSize: sizeData._sum.fileSize || 0,
            deduplicationSavings: Math.round(deduplicationSavings),
        };
    }
}
exports.ImageContributionService = ImageContributionService;
// Export singleton instance
exports.imageContributionService = new ImageContributionService();
