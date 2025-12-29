const loyaltyRepository = require('../repositories/loyaltyRepository');
const scoring = require('../utils/loyaltyScoring');

class LoyaltyService {
    /**
     * Get or create loyalty profile for a patient
     */
    async getOrCreateProfile(patientId, storeId) {
        let profile = await loyaltyRepository.getProfileByPatientId(patientId);

        if (!profile) {
            // Create new profile
            profile = await loyaltyRepository.createProfile({
                patientId,
                storeId,
                status: 'NEW',
                totalPoints: 0,
                purchaseCount: 0,
                feedbackCount: 0,
                daysSinceFirst: 0,
                consistencyScore: 0,
                engagementScore: 0,
                milestoneProgress: 0,
                recognitionMessage: scoring.generateRecognitionMessage('NEW', 0, 0),
            });

            // Create welcome event
            await this.recordEvent({
                profileId: profile.id,
                storeId,
                eventType: 'MILESTONE_REACHED',
                description: 'Loyalty journey started',
                points: 0,
            });
        }

        return profile;
    }

    /**
     * Record a loyalty event and update profile
     */
    async recordEvent(eventData) {
        const { profileId, storeId, eventType, eventSource, metadata, description, points = 0 } = eventData;

        // Create event
        const event = await loyaltyRepository.createEvent({
            profileId,
            storeId,
            eventType,
            eventSource,
            metadata,
            description,
            points,
            frequencyBonus: 0,
            timeBonus: 0,
        });

        // Update profile points
        const profile = await loyaltyRepository.getProfileByPatientId(eventData.patientId);
        if (profile) {
            await loyaltyRepository.updateProfile(profile.patientId, {
                totalPoints: profile.totalPoints + points,
                updatedAt: new Date(),
            });
        }

        return event;
    }

    /**
     * Process a purchase event and update loyalty
     */
    async processPurchase(saleId, patientId, storeId, saleAmount, itemCount) {
        // Get or create profile
        const profile = await this.getOrCreateProfile(patientId, storeId);

        // Calculate days since first purchase
        const daysSinceFirst = Math.floor((new Date() - profile.createdAt) / (1000 * 60 * 60 * 24));

        // Check for comeback bonus
        let comebackBonus = 0;
        if (profile.lastPurchaseAt) {
            const daysSinceLastPurchase = Math.floor(
                (new Date() - profile.lastPurchaseAt) / (1000 * 60 * 60 * 24)
            );

            if (scoring.shouldAwardComebackBonus(daysSinceLastPurchase)) {
                comebackBonus = 10;

                // Record comeback event
                await this.recordEvent({
                    profileId: profile.id,
                    storeId,
                    eventType: 'COMEBACK',
                    eventSource: saleId,
                    description: `Welcome back after ${daysSinceLastPurchase} days!`,
                    points: comebackBonus,
                    patientId,
                });
            }
        }

        // Calculate points for this purchase
        const purchasePoints = scoring.calculatePurchasePoints(saleAmount, itemCount);

        // Create purchase event
        await this.recordEvent({
            profileId: profile.id,
            storeId,
            eventType: 'PURCHASE_COMPLETED',
            eventSource: saleId,
            metadata: { saleAmount, itemCount },
            description: `Purchase of ₹${saleAmount}`,
            points: purchasePoints,
            patientId,
        });

        // Update profile metrics
        const newPurchaseCount = profile.purchaseCount + 1;
        const scores = scoring.calculateTotalScore(
            newPurchaseCount,
            daysSinceFirst,
            profile.feedbackCount,
            comebackBonus > 0 ? 1 : 0
        );

        // Determine new status
        const newStatus = scoring.determineStatus(
            newPurchaseCount,
            scores.consistency,
            scores.engagement,
            daysSinceFirst
        );

        const statusChanged = newStatus !== profile.status;

        // Calculate milestone progress
        const milestoneProgress = scoring.calculateMilestoneProgress(
            newStatus,
            newPurchaseCount,
            scores.consistency,
            scores.engagement,
            daysSinceFirst
        );

        // Update profile
        const updatedProfile = await loyaltyRepository.updateProfile(patientId, {
            purchaseCount: newPurchaseCount,
            daysSinceFirst,
            consistencyScore: scores.consistency,
            engagementScore: scores.engagement,
            lastPurchaseAt: new Date(),
            milestoneProgress,
            status: newStatus,
            statusSince: statusChanged ? new Date() : profile.statusSince,
            recognitionMessage: scoring.generateRecognitionMessage(
                newStatus,
                daysSinceFirst,
                newPurchaseCount
            ),
        });

        // If status upgraded, record milestone event
        if (statusChanged) {
            await this.recordEvent({
                profileId: profile.id,
                storeId,
                eventType: 'MILESTONE_REACHED',
                description: `Reached ${newStatus} status`,
                points: 10,
                patientId,
            });

            // Check if reward should be unlocked
            await this.checkAndUnlockRewards(profile.id, storeId, newStatus);
        }

        return {
            profile: updatedProfile,
            pointsEarned: purchasePoints + comebackBonus,
            statusChanged,
            newStatus,
        };
    }

    /**
     * Process feedback submission
     */
    async processFeedback(feedbackId, patientId, storeId, rating, hasComment) {
        const profile = await this.getOrCreateProfile(patientId, storeId);

        const feedbackPoints = scoring.calculateFeedbackPoints(rating, hasComment);

        // Create feedback event
        await this.recordEvent({
            profileId: profile.id,
            storeId,
            eventType: 'FEEDBACK_SUBMITTED',
            eventSource: feedbackId,
            metadata: { rating, hasComment },
            description: `Feedback provided (${rating}/5)`,
            points: feedbackPoints,
            patientId,
        });

        // Update profile
        const daysSinceFirst = Math.floor((new Date() - profile.createdAt) / (1000 * 60 * 60 * 24));
        const newFeedbackCount = profile.feedbackCount + 1;

        const scores = scoring.calculateTotalScore(
            profile.purchaseCount,
            daysSinceFirst,
            newFeedbackCount
        );

        await loyaltyRepository.updateProfile(patientId, {
            feedbackCount: newFeedbackCount,
            engagementScore: scores.engagement,
        });

        return {
            pointsEarned: feedbackPoints,
        };
    }

    /**
     * Check and unlock rewards based on status
     */
    async checkAndUnlockRewards(profileId, storeId, status) {
        // Define auto-unlocking rewards for each tier
        const tierRewards = {
            REGULAR: {
                type: 'THANK_YOU_CREDIT',
                title: '₹25 Thank You',
                description: 'Welcome to Regular status! Here\'s a small token of appreciation.',
                creditAmount: 25,
            },
            TRUSTED: {
                type: 'MILESTONE_PERK',
                title: 'Priority Support',
                description: 'You now have priority handling for all your purchases.',
                creditAmount: null,
            },
            INSIDER: {
                type: 'THANK_YOU_CREDIT',
                title: '₹100 Insider Reward',
                description: 'Congratulations on becoming an Insider!',
                creditAmount: 100,
            },
            ADVOCATE: {
                type: 'MILESTONE_PERK',
                title: 'VIP Status',
                description: 'You\'re now part of our VIP program with exclusive benefits.',
                creditAmount: null,
            },
        };

        const reward = tierRewards[status];

        if (reward) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 90); // 90 days validity

            await loyaltyRepository.createReward({
                profileId,
                storeId,
                type: reward.type,
                status: 'UNLOCKED',
                title: reward.title,
                description: reward.description,
                creditAmount: reward.creditAmount,
                minStatus: status,
                unlockedAt: new Date(),
                expiresAt,
            });

            // Record reward earned event
            await this.recordEvent({
                profileId,
                storeId,
                eventType: 'REWARD_EARNED',
                description: `Unlocked: ${reward.title}`,
                points: 0,
            });
        }
    }

    /**
     * Get profile with full details
     */
    async getProfileDetails(patientId) {
        const profile = await loyaltyRepository.getProfileByPatientId(patientId);

        if (!profile) {
            return null;
        }

        // Get next status requirements
        const nextStatus = scoring.getNextStatusRequirements(profile.status);

        // Get recent events
        const recentEvents = await loyaltyRepository.getEventsByProfile(profile.id, 10);

        // Get rewards
        const unlockedRewards = await loyaltyRepository.getUnlockedRewards(profile.id);

        return {
            profile,
            nextStatus,
            recentEvents,
            unlockedRewards,
        };
    }

    /**
     * Get progress breakdown for a profile
     */
    async getProgressBreakdown(patientId) {
        const profile = await loyaltyRepository.getProfileByPatientId(patientId);

        if (!profile) {
            return null;
        }

        const scores = scoring.calculateTotalScore(
            profile.purchaseCount,
            profile.daysSinceFirst,
            profile.feedbackCount
        );

        const nextStatus = scoring.getNextStatusRequirements(profile.status);

        return {
            currentStatus: profile.status,
            nextStatus: nextStatus?.status || null,
            progressPercent: profile.milestoneProgress,
            breakdowns: {
                frequency: {
                    score: scores.frequency,
                    maxScore: 50,
                    purchases: profile.purchaseCount,
                    target: nextStatus?.requirements.minPurchases || null,
                },
                consistency: {
                    score: scores.consistency,
                    maxScore: 30,
                    averageGap: profile.purchaseCount > 0 ? profile.daysSinceFirst / profile.purchaseCount : 0,
                    idealGap: 14,
                },
                engagement: {
                    score: scores.engagement,
                    maxScore: 20,
                    feedbacks: profile.feedbackCount,
                },
            },
            milestones: this.getMilestoneStatus(profile, nextStatus),
        };
    }

    /**
     * Get milestone status array
     */
    getMilestoneStatus(profile, nextStatus) {
        const milestones = [];

        for (const status of scoring.STATUS_ORDER) {
            const threshold = scoring.STATUS_THRESHOLDS[status];
            const currentIndex = scoring.STATUS_ORDER.indexOf(profile.status);
            const statusIndex = scoring.STATUS_ORDER.indexOf(status);

            const achieved = statusIndex <= currentIndex;

            const milestone = {
                status,
                achieved,
            };

            if (achieved) {
                // Find when this was achieved (approximate from events or status change)
                milestone.achievedAt = statusIndex === currentIndex ? profile.statusSince : null;
            } else if (status === nextStatus?.status) {
                // Show requirements for next status
                milestone.requirements = {
                    purchases: `${threshold.minPurchases - profile.purchaseCount} more`,
                    consistency: profile.consistencyScore >= threshold.minConsistency ? 'Met' : 'Keep it up',
                    engagement: profile.engagementScore >= threshold.minEngagement ? 'Met' : 'Engage more',
                    daysActive: `${Math.max(0, threshold.minDays - profile.daysSinceFirst)} more days`,
                };
            }

            milestones.push(milestone);
        }

        return milestones;
    }

    /**
     * Get store-wide engagement overview
     */
    async getEngagementOverview(storeId) {
        const stats = await loyaltyRepository.getProfileStats(storeId);
        const metrics = await loyaltyRepository.getEngagementMetrics(storeId, 30);
        const nearMilestone = await loyaltyRepository.getCustomersNearMilestone(storeId, 80);

        return {
            stats,
            metrics,
            nearMilestone,
        };
    }

    /**
     * Redeem a reward
     */
    async redeemReward(rewardId, patientId) {
        const reward = await loyaltyRepository.updateReward(rewardId, {
            status: 'REDEEMED',
            redeemedAt: new Date(),
        });

        // Get profile for event recording
        const profile = await loyaltyRepository.getProfileByPatientId(patientId);

        if (profile) {
            await this.recordEvent({
                profileId: profile.id,
                storeId: profile.storeId,
                eventType: 'REWARD_REDEEMED',
                eventSource: rewardId,
                description: `Redeemed: ${reward.title}`,
                points: 0,
                patientId,
            });
        }

        return reward;
    }
}

module.exports = new LoyaltyService();
