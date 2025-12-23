/**
 * Encryption Utility for WhatsApp Access Tokens
 * Uses AES-256-GCM for secure token storage
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Derives encryption key from environment secret
 * Supports both SMTP and WhatsApp encryption
 * @param {string} keyType - Type of key ('smtp' or 'whatsapp')
 * @returns {Buffer} 32-byte encryption key
 */
function getEncryptionKey(keyType = 'whatsapp') {
    let secret;

    if (keyType === 'smtp') {
        secret = process.env.SMTP_ENCRYPTION_KEY || process.env.WHATSAPP_ENCRYPTION_KEY;
    } else {
        secret = process.env.WHATSAPP_ENCRYPTION_KEY;
    }

    if (!secret) {
        throw new Error(`${keyType.toUpperCase()}_ENCRYPTION_KEY environment variable is required`);
    }

    // Use PBKDF2 to derive a proper 256-bit key
    const salt = keyType === 'smtp' ? 'smtp-salt' : 'whatsapp-salt';
    return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
}

/**
 * Encrypts a plaintext token
 * @param {string} plaintext - The token to encrypt
 * @param {string} keyType - Type of key to use ('smtp' or 'whatsapp')
 * @returns {string} Base64-encoded encrypted data (salt + IV + tag + ciphertext)
 */
function encryptToken(plaintext, keyType = 'whatsapp') {
    if (!plaintext) return null;

    const key = getEncryptionKey(keyType);
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    // Combine: salt + IV + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    return result.toString('base64');
}

/**
 * Decrypts an encrypted token
 * @param {string} ciphertext - Base64-encoded encrypted data
 * @param {string} keyType - Type of key to use ('smtp' or 'whatsapp')
 * @returns {string} Decrypted plaintext token
 */
function decryptToken(ciphertext, keyType = 'whatsapp') {
    if (!ciphertext) return null;

    const key = getEncryptionKey(keyType);
    const data = Buffer.from(ciphertext, 'base64');

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = data.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.subarray(ENCRYPTED_POSITION);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * SMTP-specific encryption function
 * @param {string} password - SMTP password to encrypt
 * @returns {string} Encrypted password
 */
function encryptSMTPPassword(password) {
    return encryptToken(password, 'smtp');
}

/**
 * SMTP-specific decryption function
 * @param {string} encryptedPassword - Encrypted SMTP password
 * @returns {string} Decrypted password
 */
function decryptSMTPPassword(encryptedPassword) {
    return decryptToken(encryptedPassword, 'smtp');
}

module.exports = {
    encryptToken,
    decryptToken,
    encryptSMTPPassword,
    decryptSMTPPassword,
};
