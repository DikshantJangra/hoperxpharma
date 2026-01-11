const prisma = require('../db/prisma');

class LoyaltyRepository {
    // ============================================================================
    // LOYALTY PROFILE
    // ============================================================================

    async createProfile(data) {
        return prisma.loyaltyProfile.create({
            data,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
            },
        });
    }

    async getProfileByPatientId(patientId) {
        if (!patientId) return null;
        return prisma.loyaltyProfile.findUnique({
            where: { patientId },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        events: true,
                        rewards: true,
                    },
                },
            },
        });
    }

    async getProfileById(id) {
        if (!id) return null;
        return prisma.loyaltyProfile.findUnique({
            where: { id },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        events: true,
                        rewards: true,
                    },
                },
            },
        });
    }

    async updateProfile(patientId, data) {
        return prisma.loyaltyProfile.update({
            where: { patientId },
            data,
        });
    }

    async getProfilesByStore(storeId, filters = {}) {
        const { status, limit = 50, offset = 0 } = filters;

        const where = { storeId };
        if (status) {
            where.status = status;
        }

        return prisma.loyaltyProfile.findMany({
            where,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: limit,
            skip: offset,
        });
    }

    async getProfileStats(storeId) {
        const totalProfiles = await prisma.loyaltyProfile.count({
            where: { storeId },
        });

        const statusDistribution = await prisma.loyaltyProfile.groupBy({
            by: ['status'],
            where: { storeId },
            _count: true,
        });

        const atRisk = await prisma.loyaltyProfile.count({
            where: {
                storeId,
                lastPurchaseAt: {
                    lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                },
            },
        });

        return {
            total: totalProfiles,
            statusDistribution,
            atRisk,
        };
    }

    // ============================================================================
    // LOYALTY EVENTS
    // ============================================================================

    async createEvent(data) {
        return prisma.loyaltyEvent.create({
            data,
        });
    }

    async getEventsByProfile(profileId, limit = 50) {
        return prisma.loyaltyEvent.findMany({
            where: { profileId },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    async getEventsByStore(storeId, filters = {}) {
        const { eventType, startDate, endDate, limit = 100 } = filters;

        const where = { storeId };

        if (eventType) {
            where.eventType = eventType;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        return prisma.loyaltyEvent.findMany({
            where,
            include: {
                profile: {
                    include: {
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
        });
    }

    // ============================================================================
    // LOYALTY REWARDS
    // ============================================================================

    async createReward(data) {
        return prisma.loyaltyReward.create({
            data,
        });
    }

    async getRewardsByProfile(profileId, statusFilter = null) {
        const where = { profileId };

        if (statusFilter) {
            where.status = statusFilter;
        }

        return prisma.loyaltyReward.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async updateReward(rewardId, data) {
        return prisma.loyaltyReward.update({
            where: { id: rewardId },
            data,
        });
    }

    async getUnlockedRewards(profileId) {
        return prisma.loyaltyReward.findMany({
            where: {
                profileId,
                status: 'UNLOCKED',
            },
            orderBy: {
                unlockedAt: 'desc',
            },
        });
    }

    async getExpiredRewards(storeId) {
        return prisma.loyaltyReward.findMany({
            where: {
                storeId,
                status: 'UNLOCKED',
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }

    async markRewardAsRedeemed(rewardId) {
        return prisma.loyaltyReward.update({
            where: { id: rewardId },
            data: {
                status: 'REDEEMED',
                redeemedAt: new Date(),
            },
        });
    }

    // ============================================================================
    // ANALYTICS & INSIGHTS
    // ============================================================================

    async getEngagementMetrics(storeId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const newProfiles = await prisma.loyaltyProfile.count({
            where: {
                storeId,
                createdAt: {
                    gte: startDate,
                },
            },
        });

        const recentActivity = await prisma.loyaltyEvent.count({
            where: {
                storeId,
                createdAt: {
                    gte: startDate,
                },
            },
        });

        const statusUpgrades = await prisma.loyaltyEvent.count({
            where: {
                storeId,
                eventType: 'MILESTONE_REACHED',
                createdAt: {
                    gte: startDate,
                },
            },
        });

        return {
            period: days,
            newProfiles,
            recentActivity,
            statusUpgrades,
        };
    }

    async getCustomersNearMilestone(storeId, threshold = 80) {
        return prisma.loyaltyProfile.findMany({
            where: {
                storeId,
                milestoneProgress: {
                    gte: threshold,
                    lt: 100,
                },
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
            },
            orderBy: {
                milestoneProgress: 'desc',
            },
        });
    }
}

module.exports = new LoyaltyRepository();
