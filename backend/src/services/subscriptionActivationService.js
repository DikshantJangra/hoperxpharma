/**
 * Subscription Activation Service
 * Handles subscription creation/renewal after successful payment
 * Called ONLY from webhook service after payment confirmation
 */

const { PAYMENT_STATUS } = require('../constants/payment.constants');

/**
 * Activate or renew subscription (ATOMIC TRANSACTION)
 * @param {string} storeId - Store ID
 * @param {Object} metadata - Payment metadata (planId, billingCycle, etc.)
 * @param {number} amountPaise - Amount paid in paise
 * @param {Object} tx - Prisma transaction client (optional)
 * @returns {Promise<Object>} Activation result
 */
const activateSubscription = async (storeId, metadata, amountPaise, tx) => {
    // Use transaction if provided, otherwise create new one
    const prismaClient = tx || require('../db/prisma');

    const executeActivation = async (client) => {
        const { planId, planName, billingCycle, vertical } = metadata;

        // Calculate period dates
        const now = new Date();
        const periodDates = calculatePeriodDates(billingCycle, now);

        // Determine subscription status
        const status = 'ACTIVE'; // Payment successful = active

        // Upsert subscription
        const subscription = await client.subscription.upsert({
            where: { storeId },
            update: {
                status,
                activeVerticals: [vertical],
                monthlyAmount: calculateMonthlyAmount(amountPaise, billingCycle),
                billingCycle,
                currentPeriodStart: periodDates.start,
                currentPeriodEnd: periodDates.end,
                trialEndsAt: null, // No longer in trial
                autoRenew: true,
                planId, // Legacy field
                updatedAt: now
            },
            create: {
                storeId,
                status,
                activeVerticals: [vertical],
                monthlyAmount: calculateMonthlyAmount(amountPaise, billingCycle),
                billingCycle,
                currentPeriodStart: periodDates.start,
                currentPeriodEnd: periodDates.end,
                trialEndsAt: null,
                autoRenew: true,
                planId
            }
        });

        // Create or update usage quota
        await client.usageQuota.upsert({
            where: { subscriptionId: subscription.id },
            update: {
                resetsAt: periodDates.end,
                updatedAt: now
            },
            create: {
                subscriptionId: subscription.id,
                patientCountUsed: 0,
                prescriptionCountUsed: 0,
                storageMbUsed: 0,
                resetsAt: periodDates.end
            }
        });

        console.log(`[Subscription] Activated ${planName} for store ${storeId}`);

        return {
            subscriptionId: subscription.id,
            status: subscription.status,
            activeVerticals: subscription.activeVerticals,
            currentPeriodEnd: subscription.currentPeriodEnd
        };
    };

    // Execute with or without transaction
    if (tx) {
        return await executeActivation(tx);
    } else {
        return await require('../db/prisma').$transaction(async (txClient) => {
            return await executeActivation(txClient);
        });
    }
};

/**
 * Calculate billing period dates
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @param {Date} startDate - Start date (default: now)
 * @returns {Object} { start, end }
 */
const calculatePeriodDates = (billingCycle, startDate = new Date()) => {
    const start = new Date(startDate);
    const end = new Date(startDate);

    if (billingCycle === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
    } else {
        // Default to monthly
        end.setMonth(end.getMonth() + 1);
    }

    return { start, end };
};

/**
 * Calculate monthly amount from total amount and billing cycle
 * @param {number} amountPaise - Total amount paid in paise
 * @param {string} billingCycle - 'monthly' or 'yearly'
 * @returns {number} Monthly amount in rupees (Decimal)
 */
const calculateMonthlyAmount = (amountPaise, billingCycle) => {
    const amountRupees = amountPaise / 100;

    if (billingCycle === 'yearly') {
        return amountRupees / 12;
    }

    return amountRupees;
};

/**
 * Deactivate subscription (for refunds or cancellations)
 * @param {string} storeId - Store ID
 * @param {string} reason - Reason for deactivation
 * @returns {Promise<Object>} Deactivation result
 */
const deactivateSubscription = async (storeId, reason) => {
    const prisma = require('../db/prisma');

    const subscription = await prisma.subscription.update({
        where: { storeId },
        data: {
            status: 'CANCELLED',
            autoRenew: false,
            updatedAt: new Date()
        }
    });

    console.log(`[Subscription] Deactivated for store ${storeId}: ${reason}`);

    return {
        subscriptionId: subscription.id,
        status: subscription.status
    };
};

/**
 * Get subscription details
 * @param {string} storeId - Store ID
 * @returns {Promise<Object>} Subscription details
 */
const getSubscription = async (storeId) => {
    const prisma = require('../db/prisma');

    const subscription = await prisma.subscription.findUnique({
        where: { storeId },
        include: {
            plan: true,
            usageQuota: true
        }
    });

    if (!subscription) {
        return null;
    }

    return {
        id: subscription.id,
        status: subscription.status,
        activeVerticals: subscription.activeVerticals,
        billingCycle: subscription.billingCycle,
        monthlyAmount: subscription.monthlyAmount,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew,
        plan: subscription.plan,
        usageQuota: subscription.usageQuota
    };
};

module.exports = {
    activateSubscription,
    deactivateSubscription,
    getSubscription,
    calculatePeriodDates,
    calculateMonthlyAmount
};
