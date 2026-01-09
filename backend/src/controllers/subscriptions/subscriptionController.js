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
                id: subscription.id,
                status: subscription.status,
                activeVerticals: subscription.activeVerticals || [],
                comboBundle: subscription.comboBundle,
                monthlyAmount: subscription.monthlyAmount,
                billingCycle: subscription.billingCycle || 'monthly',
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                trialEndsAt: subscription.trialEndsAt,
                autoRenew: subscription.autoRenew,
                welcomeShown: subscription.welcomeShown || false,
                welcomeShownAt: subscription.welcomeShownAt,
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
                    welcomeShown: false,
                    welcomeShownAt: null,
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

/**
 * Download invoice PDF for a payment
 * @route POST /api/v1/subscriptions/payments/:paymentId/invoice
 */
const downloadInvoice = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;
    const prisma = require('../../db/prisma');
    const PDFDocument = require('pdfkit');

    // Fetch payment with subscription and store
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            subscription: {
                include: {
                    store: { select: { id: true, name: true, addressLine1: true, addressLine2: true, city: true, state: true, pinCode: true, gstin: true, email: true, phoneNumber: true } }
                }
            }
        }
    });

    if (!payment) throw ApiError.notFound('Payment not found');

    // Verify access
    const hasAccess = await prisma.storeUser.findFirst({
        where: { storeId: payment.subscription.storeId, userId }
    });

    if (!hasAccess) throw ApiError.forbidden('Access denied');
    if (payment.status !== 'SUCCESS') throw ApiError.badRequest('Invoice only for successful payments');

    // Generate PDF
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    doc.pipe(res);

    const primaryColor = '#047857', pageWidth = doc.page.width, amount = payment.amount || (payment.amountPaise / 100);

    // Header
    doc.fontSize(24).fillColor(primaryColor).font('Helvetica-Bold').text('HopeRx', 50, 50);
    doc.fontSize(10).fillColor('#6B7280').font('Helvetica').text('Subscription Invoice', 50, 80);
    doc.fontSize(10).fillColor('#111827').font('Helvetica-Bold').text(`Invoice #${invoiceNumber}`, pageWidth - 200, 50, { width: 150, align: 'right' });
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica').text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`, pageWidth - 200, 65, { width: 150, align: 'right' });
    doc.fontSize(8).fillColor('#10B981').font('Helvetica-Bold').text('PAID', pageWidth - 200, 85, { width: 150, align: 'right' });
    doc.moveTo(50, 120).lineTo(pageWidth - 50, 120).strokeColor('#E5E7EB').lineWidth(1).stroke();

    // Business & Customer
    let y = 145;
    doc.fontSize(10).fillColor('#6B7280').font('Helvetica').text('From:', 50, y);
    doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text('HopeRx Pharma', 50, y + 18);
    doc.fontSize(10).fillColor('#6B7280').font('Helvetica').text('Billed To:', pageWidth - 250, y);
    doc.fontSize(11).fillColor('#111827').font('Helvetica-Bold').text(payment.subscription.store.name, pageWidth - 250, y + 18);

    // Table
    y = 270;
    doc.moveTo(50, y).lineTo(pageWidth - 50, y).stroke();
    doc.fontSize(12).fillColor('#111827').font('Helvetica-Bold').text('Subscription Details', 50, y + 20);
    y += 45;
    doc.rect(50, y, pageWidth - 100, 25).fillColor('#F9FAFB').fill();
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica-Bold').text('Description', 60, y + 8);
    doc.text('Amount', pageWidth - 150, y + 8, { width: 100, align: 'right' });
    y += 25;
    doc.fontSize(10).fillColor('#111827').font('Helvetica').text(payment.metadata?.planDisplayName || 'Subscription', 60, y + 8);
    doc.text(`${payment.currency} ${amount.toFixed(2)}`, pageWidth - 150, y + 8, { width: 100, align: 'right' });
    y += 40;
    doc.rect(pageWidth - 250, y, 200, 25).fillColor('#F0FDF4').fill();
    doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold').text('Total', pageWidth - 250, y + 5);
    doc.text(`${payment.currency} ${amount.toFixed(2)}`, pageWidth - 150, y + 5, { width: 100, align: 'right' });

    // Payment info
    y += 50;
    doc.moveTo(50, y).lineTo(pageWidth - 50, y).stroke();
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica').text('Transaction ID:', 50, y + 20);
    doc.fillColor('#111827').text(payment.razorpayPaymentId || payment.razorpayOrderId, 160, y + 20);

    // Footer
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY).stroke();
    doc.fontSize(8).fillColor('#6B7280').text('Thank you for your business', 50, footerY + 15, { width: pageWidth - 100, align: 'center' });

    doc.end();
});

/**
 * Mark welcome experience as shown
 * @route POST /api/v1/subscriptions/:subscriptionId/mark-welcome-shown
 */
const markWelcomeShown = asyncHandler(async (req, res) => {
    const { subscriptionId } = req.params;
    const userId = req.user.id;
    const prisma = require('../../db/prisma');

    // Get subscription with store to verify access
    const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { store: true }
    });

    if (!subscription) {
        throw ApiError.notFound('Subscription not found');
    }

    // Verify user has access to this subscription's store
    const hasAccess = await prisma.storeUser.findFirst({
        where: {
            storeId: subscription.storeId,
            userId: userId
        }
    });

    if (!hasAccess) {
        throw ApiError.forbidden('Access denied');
    }

    // Update welcome flag (idempotent - safe to call multiple times)
    const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
            welcomeShown: true,
            welcomeShownAt: subscription.welcomeShown ? subscription.welcomeShownAt : new Date()
        },
        select: {
            id: true,
            welcomeShown: true,
            welcomeShownAt: true
        }
    });

    res.status(200).json(
        new ApiResponse(200, updated, 'Welcome marked as shown')
    );
});

module.exports = {
    getSubscriptionStatus,
    getPlans,
    getUsage,
    getSubscriptionPayments,
    downloadInvoice,
    markWelcomeShown,
};
