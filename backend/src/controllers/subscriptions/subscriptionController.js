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
    // Fallback: If subscription is missing (unlikely but possible), check if payment has storeId directly
    // or if we can infer it.
    let storeId = payment.subscription?.storeId;
    let storeName = payment.subscription?.store?.name;

    // If no subscription linked, check if payment has storeId directly (assuming schema supports it)
    if (!storeId && payment.storeId) {
        storeId = payment.storeId;
        // We might need to fetch store name if not included
        if (!storeName) {
            const store = await prisma.store.findUnique({
                where: { id: storeId },
                select: { name: true }
            });
            storeName = store?.name;
        }
    }

    if (!storeId) {
        // Last resort: If context has storeId (from auth middleware if applicable)
        // But for safety, if we can't link payment to a store, we shouldn't allow access easily.
        // However, if the user IS the owner of the store associated with params...
        // Let's rely on what we have.
        console.error('[Invoice] Payment missing store association:', paymentId);
        throw ApiError.badRequest('Could not verify store ownership for this payment');
    }

    const hasAccess = await prisma.storeUser.findFirst({
        where: { storeId, userId }
    });

    if (!hasAccess) throw ApiError.forbidden('Access denied');
    if (payment.status !== 'SUCCESS') throw ApiError.badRequest('Invoice only for successful payments');

    // Generate PDF
    // improved "Concise" Design
    const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const primaryColor = '#065F46'; // Emerald 800
    const accentColor = '#D1FAE5'; // Emerald 100

    // 1. Header Block (Full Width)
    doc.rect(0, 0, pageWidth, 160).fillColor(primaryColor).fill();

    // Logo / Brand
    doc.fontSize(32).fillColor('white').font('Helvetica-Bold').text('HopeRx', 50, 40);
    doc.fontSize(10).font('Helvetica').text('Pharma OS', 50, 75);

    // Invoice Label & Number
    doc.fontSize(40).fillColor(accentColor).opacity(0.1).text('INVOICE', pageWidth - 250, 20); // Background watermark style
    doc.opacity(1).fontSize(12).fillColor('white').text('INVOICE NO', pageWidth - 200, 50, { align: 'right' });
    doc.fontSize(16).font('Helvetica-Bold').text(invoiceNumber, pageWidth - 200, 65, { align: 'right' });

    doc.fontSize(10).font('Helvetica').fillColor('#A7F3D0').text('DATE', pageWidth - 200, 95, { align: 'right' });
    doc.fontSize(12).fillColor('white').text(new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), pageWidth - 200, 110, { align: 'right' });

    // 2. Body Content (White Background)
    const bodyStart = 200;

    // Billing Columns
    // Left: Billed To
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica-Bold').text('BILLED TO', 50, bodyStart);
    doc.fontSize(14).fillColor('#111827').text(storeName || 'Valued Customer', 50, bodyStart + 15);
    // doc.fontSize(10).fillColor('#4B5563').font('Helvetica').text('Store ID: ' + storeId.slice(0,8), 50, bodyStart + 35);

    // Right: Payment Method
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica-Bold').text('PAYMENT METHOD', pageWidth - 250, bodyStart);
    doc.fontSize(12).fillColor('#111827').text('Online Payment', pageWidth - 250, bodyStart + 15);
    doc.fontSize(10).fillColor('#4B5563').text(`TxID: ${payment.razorpayPaymentId || payment.razorpayOrderId}`, pageWidth - 250, bodyStart + 35);

    // 3. The "Main Event" - Subscription Item (Centered Box)
    const boxTop = 320;
    const boxHeight = 150;

    // Light background box
    doc.roundedRect(50, boxTop, pageWidth - 100, boxHeight, 8).fillColor('#F9FAFB').fill();
    doc.strokeColor('#E5E7EB').lineWidth(1).roundedRect(50, boxTop, pageWidth - 100, boxHeight, 8).stroke();

    // Plan Name (Big Center)
    const planName = payment.metadata?.planDisplayName || 'HopeRx Premium Subscription';
    const amount = payment.amount || (payment.amountPaise / 100);

    doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text(planName, 0, boxTop + 40, { align: 'center', width: pageWidth });

    // Subtext (Billing Cycle)
    doc.fillColor('#6B7280').fontSize(12).font('Helvetica').text('Premium Access License', 0, boxTop + 75, { align: 'center', width: pageWidth });

    // Price (Big Center)
    doc.fillColor(primaryColor).fontSize(32).font('Helvetica-Bold').text(`${payment.currency} ${amount.toFixed(2)}`, 0, boxTop + 100, { align: 'center', width: pageWidth });

    // 4. Footer / Terms
    const footerY = 600;
    doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY).strokeColor('#E5E7EB').stroke();

    doc.fontSize(9).fillColor('#9CA3AF').text('Thank you for choosing HopeRx.', 50, footerY + 20, { align: 'center', width: pageWidth - 100 });
    doc.text('This is a computer generated invoice.', 50, footerY + 35, { align: 'center', width: pageWidth - 100 });

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
