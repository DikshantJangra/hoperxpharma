const loyaltyService = require('../services/loyaltyService');
const logger = require('../config/logger');
const loyaltyRepository = require('../repositories/loyaltyRepository');

class LoyaltyController {
    /**
     * GET /api/engage/loyalty/profile/:patientId
     * Get loyalty profile for a customer
     */
    async getProfile(req, res) {
        try {
            const { patientId } = req.params;

            const details = await loyaltyService.getProfileDetails(patientId);

            if (!details) {
                return res.status(404).json({
                    error: 'Loyalty profile not found',
                });
            }

            return res.json({
                profile: details.profile,
                nextStatus: details.nextStatus,
                recentActivity: details.recentEvents.slice(0, 5),
                unlockedRewards: details.unlockedRewards,
            });
        } catch (error) {
            logger.error('Error fetching loyalty profile:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty profile',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/engage/loyalty/progress/:patientId
     * Get detailed progress breakdown
     */
    async getProgress(req, res) {
        try {
            const { patientId } = req.params;

            const progress = await loyaltyService.getProgressBreakdown(patientId);

            if (!progress) {
                return res.status(404).json({
                    error: 'Loyalty profile not found',
                });
            }

            return res.json({ progress });
        } catch (error) {
            logger.error('Error fetching loyalty progress:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty progress',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/engage/loyalty/rewards/:patientId
     * Get available and unlocked rewards
     */
    async getRewards(req, res) {
        try {
            const { patientId } = req.params;

            const profile = await loyaltyRepository.getProfileByPatientId(patientId);

            if (!profile) {
                return res.status(404).json({
                    error: 'Loyalty profile not found',
                });
            }

            const unlocked = await loyaltyRepository.getRewardsByProfile(profile.id, 'UNLOCKED');
            const redeemed = await loyaltyRepository.getRewardsByProfile(profile.id, 'REDEEMED');

            // Get upcoming rewards (locked)
            const locked = await loyaltyRepository.getRewardsByProfile(profile.id, 'LOCKED');

            return res.json({
                rewards: {
                    unlocked,
                    redeemed,
                    upcoming: locked,
                },
            });
        } catch (error) {
            logger.error('Error fetching loyalty rewards:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty rewards',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/engage/loyalty/history/:patientId
     * Get event history for transparency
     */
    async getHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { limit = 50 } = req.query;

            const profile = await loyaltyRepository.getProfileByPatientId(patientId);

            if (!profile) {
                return res.status(404).json({
                    error: 'Loyalty profile not found',
                });
            }

            const events = await loyaltyRepository.getEventsByProfile(profile.id, parseInt(limit));

            return res.json({
                history: events,
                total: events.length,
            });
        } catch (error) {
            logger.error('Error fetching loyalty history:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty history',
                message: error.message,
            });
        }
    }

    /**
     * POST /api/engage/loyalty/events
     * (Internal) Record a loyalty event
     */
    async recordEvent(req, res) {
        try {
            const { patientId, storeId, eventType, eventSource, metadata } = req.body;

            if (!patientId || !storeId || !eventType) {
                return res.status(400).json({
                    error: 'Missing required fields: patientId, storeId, eventType',
                });
            }

            const profile = await loyaltyService.getOrCreateProfile(patientId, storeId);

            const event = await loyaltyService.recordEvent({
                profileId: profile.id,
                storeId,
                eventType,
                eventSource,
                metadata,
                patientId,
            });

            return res.json({
                success: true,
                event,
            });
        } catch (error) {
            logger.error('Error recording loyalty event:', error);
            return res.status(500).json({
                error: 'Failed to record loyalty event',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/engage/loyalty/overview
     * Get store-wide loyalty overview
     */
    async getOverview(req, res) {
        try {
            const { storeId } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    error: 'storeId is required',
                });
            }

            const overview = await loyaltyService.getEngagementOverview(storeId);

            return res.json({
                overview,
            });
        } catch (error) {
            logger.error('Error fetching loyalty overview:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty overview',
                message: error.message,
            });
        }
    }

    /**
     * GET /api/engage/loyalty/customers
     * Get all customers with loyalty profiles for a store
     */
    async getCustomers(req, res) {
        try {
            const { storeId, status, limit, offset } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    error: 'storeId is required',
                });
            }

            const profiles = await loyaltyRepository.getProfilesByStore(storeId, {
                status,
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
            });

            return res.json({
                customers: profiles,
                total: profiles.length,
            });
        } catch (error) {
            logger.error('Error fetching loyalty customers:', error);
            return res.status(500).json({
                error: 'Failed to fetch loyalty customers',
                message: error.message,
            });
        }
    }

    /**
     * POST /api/engage/loyalty/redeem/:rewardId
     * Redeem a reward
     */
    async redeemReward(req, res) {
        try {
            const { rewardId } = req.params;
            const { patientId } = req.body;

            if (!patientId) {
                return res.status(400).json({
                    error: 'patientId is required',
                });
            }

            const reward = await loyaltyService.redeemReward(rewardId, patientId);

            return res.json({
                success: true,
                reward,
            });
        } catch (error) {
            logger.error('Error redeeming reward:', error);
            return res.status(500).json({
                error: 'Failed to redeem reward',
                message: error.message,
            });
        }
    }
}

module.exports = new LoyaltyController();
