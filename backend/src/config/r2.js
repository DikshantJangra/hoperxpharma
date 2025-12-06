const { S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize R2 client with S3-compatible endpoint
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'hoperx-objects';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT;

/**
 * Generate a presigned URL for uploading to R2
 * @param {string} key - Object key in R2
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Presigned URL
 */
async function getPresignedUploadUrl(key, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading from R2
 * @param {string} key - Object key in R2
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Presigned URL
 */
async function getPresignedDownloadUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get public URL for an object (if using custom domain/CDN)
 * @param {string} key - Object key in R2
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
    return `${PUBLIC_URL}/${key}`;
}

/**
 * Upload a buffer to R2
 * @param {string} key - Object key in R2
 * @param {Buffer} buffer - File buffer
 * @param {string} contentType - MIME type
 * @returns {Promise<void>}
 */
async function uploadObject(key, buffer, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    });

    await r2Client.send(command);
}

/**
 * Download an object from R2
 * @param {string} key - Object key in R2
 * @returns {Promise<{Body: ReadableStream, ContentType: string}>}
 */
async function getObject(key) {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await r2Client.send(command);
}

/**
 * Delete an object from R2
 * @param {string} key - Object key in R2
 * @returns {Promise<void>}
 */
async function deleteObject(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
}

/**
 * Convert ReadableStream to Buffer
 * @param {ReadableStream} stream
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

module.exports = {
    r2Client,
    BUCKET_NAME,
    PUBLIC_URL,
    getPresignedUploadUrl,
    getPresignedDownloadUrl,
    getPublicUrl,
    uploadObject,
    getObject,
    deleteObject,
    streamToBuffer,
};
