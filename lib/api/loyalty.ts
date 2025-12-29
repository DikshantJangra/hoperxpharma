import { apiClient } from './client';

export interface LoyaltyProfile {
    id: string;
    patientId: string;
    storeId: string;
    status: 'NEW' | 'REGULAR' | 'TRUSTED' | 'INSIDER' | 'ADVOCATE';
    statusSince: string;
    totalPoints: number;
    purchaseCount: number;
    feedbackCount: number;
    daysSinceFirst: number;
    consistencyScore: number;
    engagementScore: number;
    lastPurchaseAt?: string;
    nextMilestoneAt?: string;
    milestoneProgress: number;
    recognitionMessage?: string;
    recognizedAt?: string;
    createdAt: string;
    updatedAt: string;
    patient?: {
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
    };
}

export interface LoyaltyEvent {
    id: string;
    profileId: string;
    storeId: string;
    eventType: 'PURCHASE_COMPLETED' | 'FEEDBACK_SUBMITTED' | 'PRESCRIPTION_FILLED' | 'MILESTONE_REACHED' | 'REWARD_EARNED' | 'REWARD_REDEEMED' | 'COMEBACK';
    eventSource?: string;
    points: number;
    frequencyBonus: number;
    timeBonus: number;
    metadata?: any;
    description?: string;
    createdAt: string;
}

export interface LoyaltyReward {
    id: string;
    profileId: string;
    storeId: string;
    type: 'THANK_YOU_CREDIT' | 'MILESTONE_PERK' | 'PRIORITY_SERVICE' | 'EARLY_ACCESS' | 'SURPRISE_BONUS' | 'COMEBACK_WELCOME';
    status: 'LOCKED' | 'UNLOCKED' | 'REDEEMED' | 'EXPIRED';
    title: string;
    description?: string;
    minStatus?: string;
    minPoints?: number;
    creditAmount?: number;
    unlockedAt?: string;
    redeemedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProgressBreakdown {
    currentStatus: string;
    nextStatus: string | null;
    progressPercent: number;
    breakdowns: {
        frequency: {
            score: number;
            maxScore: number;
            purchases: number;
            target: number | null;
        };
        consistency: {
            score: number;
            maxScore: number;
            averageGap: number;
            idealGap: number;
        };
        engagement: {
            score: number;
            maxScore: number;
            feedbacks: number;
        };
    };
    milestones: Array<{
        status: string;
        achieved: boolean;
        achievedAt?: string | null;
        requirements?: {
            purchases: string;
            consistency: string;
            engagement: string;
            daysActive: string;
        };
    }>;
}

export interface EngagementOverview {
    stats: {
        total: number;
        statusDistribution: Array<{
            status: string;
            _count: number;
        }>;
        atRisk: number;
    };
    metrics: {
        period: number;
        newProfiles: number;
        recentActivity: number;
        statusUpgrades: number;
    };
    nearMilestone: Array<LoyaltyProfile>;
}

class LoyaltyAPI {
    /**
     * Get loyalty profile for a customer
     */
    async getProfile(patientId: string) {
        return await apiClient.get(`/engage/loyalty/profile/${patientId}`);
    }

    /**
     * Get detailed progress breakdown
     */
    async getProgress(patientId: string): Promise<{ progress: ProgressBreakdown }> {
        return await apiClient.get(`/engage/loyalty/progress/${patientId}`);
    }

    /**
     * Get rewards for a customer
     */
    async getRewards(patientId: string) {
        return await apiClient.get(`/engage/loyalty/rewards/${patientId}`);
    }

    /**
     * Get event history for a customer
     */
    async getHistory(patientId: string, limit = 50): Promise<{ history: LoyaltyEvent[]; total: number }> {
        return await apiClient.get(`/engage/loyalty/history/${patientId}?limit=${limit}`);
    }

    /**
     * Get store-wide loyalty overview
     */
    async getOverview(storeId: string): Promise<{ overview: EngagementOverview }> {
        return await apiClient.get(`/engage/loyalty/overview?storeId=${storeId}`);
    }

    /**
     * Get all loyalty customers for a store
     */
    async getCustomers(storeId: string, filters?: { status?: string; limit?: number; offset?: number }) {
        const queryParams = new URLSearchParams({ storeId, ...(filters || {}) as any });
        return await apiClient.get(`/engage/loyalty/customers?${queryParams.toString()}`);
    }

    /**
     * Redeem a reward
     */
    async redeemReward(rewardId: string, patientId: string) {
        return await apiClient.post(`/engage/loyalty/redeem/${rewardId}`, {
            patientId,
        });
    }

    /**
     * Record a loyalty event (internal)
     */
    async recordEvent(event: {
        patientId: string;
        storeId: string;
        eventType: string;
        eventSource?: string;
        metadata?: any;
    }) {
        return await apiClient.post('/engage/loyalty/events', event);
    }
}

export const loyaltyAPI = new LoyaltyAPI();
export default loyaltyAPI;
