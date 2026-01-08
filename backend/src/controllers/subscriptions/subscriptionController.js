const subscriptionService = require('../../services/subscriptions/subscriptionService');
const asyncHandler = require('../../middlewares/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * Get current store's subscription status
 * @route GET /api/v1/subscriptions/status
 */
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    try {
        const subscription = await subscriptionService.getStoreSubscription(storeId);

        res.status(200).json(
            new ApiResponse(200, {
                status: subscription.status,
                activeVerticals: subscription.activeVerticals || [],
                comboBundle: subscription.comboBundle,
                monthlyAmount: subscription.monthlyAmount,
                billingCycle: subscription.billingCycle || 'monthly',
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                trialEndsAt: subscription.trialEndsAt,
                autoRenew: subscription.autoRenew,
                plan: subscription.plan ? {
                    id: subscription.plan.id,
                    name: subscription.plan.name,
                    displayName: subscription.plan.displayName,
                } : null,
            }, 'Subscription status retrieved successfully')
        );
    } catch (error) {
        // If no subscription found, return default trial state
        if (error.statusCode === 404) {
            res.status(200).json(
                new ApiResponse(200, {
                    status: 'TRIAL',
                    activeVerticals: ['retail'],
                    comboBundle: null,
                    monthlyAmount: 0,
                    billingCycle: 'monthly',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                    autoRenew: false,
                    plan: null,
                }, 'Default trial subscription')
            );
        } else {
            throw error;
        }
    }
});

/**
 * Get all subscription plans
 * @route GET /api/v1/subscriptions/plans
 */
const getPlans = asyncHandler(async (req, res) => {
    const plans = await subscriptionService.getPlans();

    res.status(200).json(
        new ApiResponse(200, plans, 'Subscription plans retrieved successfully')
    );
});

/**
 * Get subscription usage
 * @route GET /api/v1/subscriptions/usage
 */
const getUsage = asyncHandler(async (req, res) => {
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    const usage = await subscriptionService.getUsage(storeId);

    res.status(200).json(
        new ApiResponse(200, usage, 'Subscription usage retrieved successfully')
    );
});

/**
 * Get subscription payment history
 * @route GET /api/v1/subscriptions/payments
 */
const getSubscriptionPayments = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { storeId, limit = 20, offset = 0 } = req.query;

    if (!storeId) {
        throw ApiError.badRequest('Store ID is required');
    }

    const prisma = require('../../db/prisma');
    
    // Verify access
    const storeUser = await prisma.storeUser.findUnique({
        where: { userId_storeId: { userId, storeId } }
    });

    if (!storeUser) {
        throw new ApiError(403, 'Access denied');
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where: { storeId, status: { in: ['SUCCESS', 'PROCESSING', 'FAILED'] } },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                amount: true,
                amountPaise: true,
                currency: true,
                status: true,
                method: true,
                razorpayOrderId: true,
                razorpayPaymentId: true,
                createdAt: true,
                completedAt: true,
                metadata: true
            }
        }),
        prisma.payment.count({ 
            where: { storeId, status: { in: ['SUCCESS', 'PROCESSING', 'FAILED'] } } 
        })
    ]);

    res.status(200).json(
        new ApiResponse(200, {
            payments: payments.map(p => ({
                id: p.id,
                amount: parseFloat(p.amount),
                amountPaise: p.amountPaise,
                currency: p.currency,
                status: p.status,
                method: p.method,
                razorpayOrderId: p.razorpayOrderId,
                razorpayPaymentId: p.razorpayPaymentId,
                planName: p.metadata?.planName || 'Unknown',
                planDisplayName: p.metadata?.planDisplayName || 'Subscription',
                billingCycle: p.metadata?.billingCycle || 'monthly',
                createdAt: p.createdAt,
                completedAt: p.completedAt
            })),
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            }
        }, 'Payment history retrieved')
    );
});

module.exports = {
    getSubscriptionStatus,
    getPlans,
    getUsage,
    getSubscriptionPayments,
};
