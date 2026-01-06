const database = require('../config/database');

const prisma = database.getClient();

/**
 * Subscription Repository - Data access layer for subscription operations
 */
class SubscriptionRepository {
    /**
     * Get all subscription plans
     */
    async getPlans() {
        return await prisma.subscriptionPlan.findMany({
            orderBy: {
                price: 'asc',
            },
        });
    }

    /**
     * Get plan by ID
     */
    async getPlanById(id) {
        return await prisma.subscriptionPlan.findUnique({
            where: { id },
        });
    }

    /**
     * Get plan by name
     */
    async getPlanByName(name) {
        return await prisma.subscriptionPlan.findFirst({
            where: { name },
        });
    }

    /**
     * Create subscription for store
     */
    async createSubscription(subscriptionData) {
        return await prisma.subscription.create({
            data: subscriptionData,
            include: {
                plan: true,
            },
        });
    }

    /**
     * Get store subscription
     */
    async getStoreSubscription(storeId) {
        return await prisma.subscription.findFirst({
            where: { storeId },
            include: {
                plan: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Update subscription
     */
    async updateSubscription(id, subscriptionData) {
        return await prisma.subscription.update({
            where: { id },
            data: subscriptionData,
            include: {
                plan: true,
            },
        });
    }

    /**
     * Get subscription usage
     */
    async getUsage(storeId) {
        const [patients, prescriptions, storage] = await Promise.all([
            prisma.patient.count({ where: { storeId } }),
            prisma.prescription.count({ where: { storeId } }),
            // Storage calculation would need actual file sizes
            Promise.resolve(0),
        ]);

        return {
            patients,
            prescriptions,
            storageGB: storage,
        };
    }

    /**
     * Check if subscription is active
     */
    async isSubscriptionActive(storeId) {
        const subscription = await this.getStoreSubscription(storeId);

        if (!subscription) return false;

        const now = new Date();
        return (
            (subscription.status === 'ACTIVE' || subscription.status === 'TRIAL') &&
            subscription.currentPeriodEnd > now
        );
    }

    /**
     * Check quota limits
     */
    async checkQuota(storeId, quotaType) {
        const subscription = await this.getStoreSubscription(storeId);

        if (!subscription || !subscription.plan) {
            return { allowed: false, limit: 0, current: 0 };
        }

        const usage = await this.getUsage(storeId);
        const plan = subscription.plan;

        let limit, current;
        switch (quotaType) {
            case 'patients':
                limit = plan.maxPatients;
                current = usage.patients;
                break;
            case 'prescriptions':
                limit = plan.maxPrescriptions;
                current = usage.prescriptions;
                break;
            case 'storage':
                limit = plan.maxStorageGB;
                current = usage.storageGB;
                break;
            default:
                return { allowed: false, limit: 0, current: 0 };
        }

        return {
            allowed: current < limit,
            limit,
            current,
            remaining: limit - current,
        };
    }
}

module.exports = new SubscriptionRepository();
