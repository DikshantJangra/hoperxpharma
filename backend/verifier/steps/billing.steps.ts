import { ScenarioContext, StepResult } from '../types';

const subscriptionService = require('../../src/services/subscriptions/subscriptionService');
const subscriptionRepository = require('../../src/repositories/subscriptionRepository');

export const billingSteps = {
    /**
     * Verify current subscription status
     */
    async verifySubscriptionStatus(ctx: ScenarioContext, expectedActive: boolean): Promise<StepResult> {
        const storeId = ctx.storeId;
        console.log(`[DEBUG] Verify Subscription Status for store: ${storeId}`);
        if (!storeId) throw new Error('Store ID not found in context');

        try {
            console.log('[DEBUG] Calling isSubscriptionActive...');
            const isActive = await subscriptionRepository.isSubscriptionActive(storeId);
            console.log(`[DEBUG] isSubscriptionActive result: ${isActive}`);

            console.log('[DEBUG] Calling getStoreSubscription...');
            const subscription = await subscriptionRepository.getStoreSubscription(storeId);
            console.log(`[DEBUG] getStoreSubscription result: ${subscription ? subscription.id : 'null'}`);

            ctx.set('subscription', subscription);
            ctx.set('isSubscriptionActive', isActive);

            if (isActive !== expectedActive) {
                return {
                    success: false,
                    duration: 0,
                    error: new Error(`Expected subscription active=${expectedActive}, got ${isActive}`)
                };
            }

            return {
                success: true,
                duration: 0, // Injected by runner
                data: { isActive, subscription }
            };
        } catch (error: any) {
            return {
                success: false,
                duration: 0,
                error
            };
        }
    },

    /**
     * Manually expire subscription for testing
     */
    async expireSubscription(ctx: ScenarioContext): Promise<StepResult> {
        const storeId = ctx.storeId;
        if (!storeId) throw new Error('Store ID not found in context');

        try {
            const subscription = await subscriptionRepository.getStoreSubscription(storeId);
            if (!subscription) throw new Error('No subscription to expire');

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1); // Yesterday

            // Direct update via repository
            const expired = await subscriptionRepository.updateSubscription(subscription.id, {
                status: 'EXPIRED', // or keep active but past date? Repository checks date.
                currentPeriodEnd: pastDate
            });

            ctx.set('subscription', expired);
            return {
                success: true,
                duration: 0,
                data: expired
            };
        } catch (error: any) {
            return {
                success: false,
                duration: 0,
                error
            };
        }
    },

    /**
     * Upgrade subscription to a specific plan
     */
    async upgradeSubscription(ctx: ScenarioContext, planName: string): Promise<StepResult> {
        const storeId = ctx.storeId;
        if (!storeId) throw new Error('Store ID not found in context');

        try {
            const plan = await subscriptionRepository.getPlanByName(planName);
            if (!plan) throw new Error(`Plan ${planName} not found`);

            const upgraded = await subscriptionService.updateSubscription(storeId, plan.id);
            ctx.set('subscription', upgraded);

            return {
                success: true,
                duration: 0,
                data: upgraded
            };
        } catch (error: any) {
            return {
                success: false,
                duration: 0,
                error
            };
        }
    }
};
