const bcrypt = require('bcrypt');
const crypto = require('crypto');
const prisma = require('../db/prisma');
const ApiError = require('../utils/ApiError');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

class AdminPinService {
    /**
     * Setup or update admin PIN for a user
     * @param {string} userId
     * @param {string} pin - 6 digit PIN
     * @returns {Promise<object>}
     */
    async setupPin(userId, pin) {
        // Validate PIN (6 digits)
        if (!/^\d{6}$/.test(pin)) {
            throw ApiError.badRequest('PIN must be exactly 6 digits');
        }

        // Hash PIN using bcrypt (salt is included in the hash)
        const pinHash = await bcrypt.hash(pin, 10);
        const salt = 'bcrypt'; // Placeholder as bcrypt handles salt internally

        const adminPin = await prisma.adminPin.upsert({
            where: { userId },
            create: {
                userId,
                pinHash,
                salt,
            },
            update: {
                pinHash,
                salt,
                failedAttempts: 0,
                lockedUntil: null,
            },
        });

        return { success: true, message: 'Admin PIN set up successfully' };
    }

    /**
     * Verify admin PIN
     * @param {string} userId
     * @param {string} pin
     * @returns {Promise<boolean>}
     */
    async verifyPin(userId, pin) {
        const adminPin = await prisma.adminPin.findUnique({
            where: { userId },
        });

        if (!adminPin) {
            throw ApiError.notFound('Admin PIN not set up. Please set up your PIN first.');
        }

        // Check if locked
        if (adminPin.lockedUntil && adminPin.lockedUntil > new Date()) {
            const minutesRemaining = Math.ceil((adminPin.lockedUntil - new Date()) / 60000);
            throw ApiError.forbidden(
                `PIN locked due to too many failed attempts. Try again in ${minutesRemaining} minutes.`
            );
        }

        // Verify PIN
        const isValid = await bcrypt.compare(pin, adminPin.pinHash);

        if (!isValid) {
            // Increment failed attempts
            const failedAttempts = adminPin.failedAttempts + 1;
            const lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
                : null;

            await prisma.adminPin.update({
                where: { userId },
                data: { failedAttempts, lockedUntil },
            });

            const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedAttempts;
            if (attemptsRemaining > 0) {
                throw ApiError.unauthorized(
                    `Invalid PIN. ${attemptsRemaining} attempts remaining before lockout.`
                );
            } else {
                throw ApiError.forbidden(
                    `Invalid PIN. Account locked for ${LOCKOUT_DURATION_MINUTES} minutes.`
                );
            }
        }

        // Reset failed attempts and update last used
        await prisma.adminPin.update({
            where: { userId },
            data: {
                failedAttempts: 0,
                lockedUntil: null,
                lastUsedAt: new Date(),
            },
        });

        return true;
    }

    /**
     * Change admin PIN
     * @param {string} userId
     * @param {string} oldPin
     * @param {string} newPin
     * @returns {Promise<object>}
     */
    async changePin(userId, oldPin, newPin) {
        // Verify old PIN first
        await this.verifyPin(userId, oldPin);

        // Set new PIN
        await this.setupPin(userId, newPin);

        return { success: true, message: 'Admin PIN changed successfully' };
    }

    /**
     * Check if user has PIN set up
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async hasPinSetup(userId) {
        const adminPin = await prisma.adminPin.findUnique({
            where: { userId },
        });
        return !!adminPin;
    }
}

module.exports = new AdminPinService();
