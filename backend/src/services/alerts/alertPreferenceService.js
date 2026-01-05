const database = require('../../config/database');
const logger = require('../../config/logger');

const prisma = database.getClient();

/**
 * Alert Preference Service - Manages user alert preferences
 */
class AlertPreferenceService {
    /**
     * Get user preferences for a store
     * If no preferences exist, return defaults
     */
    async getUserPreferences(userId, storeId) {
        try {
            const preferences = await prisma.alertPreference.findMany({
                where: {
                    userId,
                    storeId,
                },
            });

            // If no preferences found, return default preferences
            if (preferences.length === 0) {
                return this.getDefaultPreferences();
            }

            return preferences;
        } catch (error) {
            logger.error('Error getting user preferences:', error);
            throw error;
        }
    }

    /**
     * Get default preferences (all categories enabled with IN_APP channel)
     */
    getDefaultPreferences() {
        const categories = ['INVENTORY', 'SECURITY', 'PATIENT', 'BILLING', 'SYSTEM', 'CLINICAL'];

        return categories.map(category => ({
            category,
            channels: ['IN_APP'],
            enabled: true,
            quietHoursStart: null,
            quietHoursEnd: null,
            digestMode: false,
        }));
    }

    /**
     * Update or create user preferences
     */
    async updateUserPreferences(userId, storeId, preferences) {
        try {
            const results = [];

            for (const pref of preferences) {
                const result = await prisma.alertPreference.upsert({
                    where: {
                        userId_storeId_category: {
                            userId,
                            storeId,
                            category: pref.category,
                        },
                    },
                    update: {
                        channels: pref.channels || ['IN_APP'],
                        enabled: pref.enabled !== undefined ? pref.enabled : true,
                        quietHoursStart: pref.quietHoursStart || null,
                        quietHoursEnd: pref.quietHoursEnd || null,
                        digestMode: pref.digestMode || false,
                    },
                    create: {
                        userId,
                        storeId,
                        category: pref.category,
                        channels: pref.channels || ['IN_APP'],
                        enabled: pref.enabled !== undefined ? pref.enabled : true,
                        quietHoursStart: pref.quietHoursStart || null,
                        quietHoursEnd: pref.quietHoursEnd || null,
                        digestMode: pref.digestMode || false,
                    },
                });

                results.push(result);
            }

            logger.info(`Updated alert preferences for user ${userId} in store ${storeId}`);
            return results;
        } catch (error) {
            logger.error('Error updating user preferences:', error);
            throw error;
        }
    }

    /**
     * Check if user should receive alert based on preferences
     */
    async shouldReceiveAlert(userId, storeId, category, channel) {
        try {
            const pref = await prisma.alertPreference.findUnique({
                where: {
                    userId_storeId_category: {
                        userId,
                        storeId,
                        category,
                    },
                },
            });

            // If no preference, use default (enabled)
            if (!pref) {
                return channel === 'IN_APP'; // Only IN_APP by default
            }

            // Check if category is enabled
            if (!pref.enabled) {
                return false;
            }

            // Check if channel is enabled
            if (!pref.channels.includes(channel)) {
                return false;
            }

            // Check quiet hours
            if (pref.quietHoursStart && pref.quietHoursEnd) {
                const isQuietTime = this.isWithinQuietHours(
                    pref.quietHoursStart,
                    pref.quietHoursEnd
                );

                if (isQuietTime) {
                    logger.debug(`Alert suppressed due to quiet hours for user ${userId}`);
                    return false;
                }
            }

            return true;
        } catch (error) {
            logger.error('Error checking alert preferences:', error);
            // Default to allowing alert on error
            return channel === 'IN_APP';
        }
    }

    /**
     * Check if current time is within quiet hours
     */
    isWithinQuietHours(startTime, endTime) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // If start time is before end time (e.g., 22:00 - 08:00 crosses midnight)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        }

        // Normal case (e.g., 14:00 - 18:00)
        return currentTime >= startTime && currentTime < endTime;
    }
}

module.exports = new AlertPreferenceService();
