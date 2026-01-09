const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const { validateStoreAccess } = require('../middlewares/storeAccess');
const prisma = require('../config/database');
const PDFDocument = require('pdfkit');

/**
 * Generate and download subscription invoice PDF
 * POST /api/v1/subscriptions/payments/:paymentId/invoice
 */
router.post('/payments/:paymentId/invoice', authenticateToken, async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        // Fetch payment with subscription and store details
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                subscription: {
                    include: {
                        store: {
                            select: {
                                id: true,
                                name: true,
                                addressLine1: true,
                                addressLine2: true,
                                city: true,
                                state: true,
                                pinCode: true,
                                gstin: true,
                                email: true,
                                phoneNumber: true,
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // Verify user has access to this payment's store
        const hasAccess = await prisma.storeUser.findFirst({
            where: {
                storeId: payment.subscription.storeId,
                userId: userId
            }
        });

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Only generate invoice for successful payments
        if (payment.status !== 'SUCCESS') {
            return res.status(400).json({
                success: false,
                message: 'Invoice can only be generated for successful payments'
            });
        }

        // Generate invoice PDF
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Set response headers
        const invoiceNumber = `INV-${payment.id.slice(0, 8).toUpperCase()}`;
        const filename = `${invoiceNumber}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // Colors
        const primaryColor = '#047857'; // Emerald
        const textPrimary = '#111827';
        const textSecondary = '#6B7280';
        const borderColor = '#E5E7EB';
        const pageWidth = doc.page.width;

        // Header
        doc
            .fontSize(24)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('HopeRx', 50, 50);

        doc
            .fontSize(10)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Subscription Invoice', 50, 80);

        // Invoice details (right)
        doc
            .fontSize(10)
            .fillColor(textPrimary)
            .font('Helvetica-Bold')
            .text(`Invoice #${invoiceNumber}`, pageWidth - 200, 50, {
                width: 150,
                align: 'right',
            });

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text(
                `Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`,
                pageWidth - 200,
                65,
                { width: 150, align: 'right' }
            );

        doc
            .fontSize(8)
            .fillColor('#10B981')
            .font('Helvetica-Bold')
            .text('PAID', pageWidth - 200, 85, {
                width: 150,
                align: 'right',
            });

        // Divider
        doc
            .moveTo(50, 120)
            .lineTo(pageWidth - 50, 120)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        let yPos = 145;

        // Business details
        doc
            .fontSize(10)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('From:', 50, yPos);

        yPos += 18;
        doc
            .fontSize(11)
            .fillColor(textPrimary)
            .font('Helvetica-Bold')
            .text('HopeRx Pharma', 50, yPos);

        yPos += 15;
        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Pharmacy Management System', 50, yPos, { width: 200 });

        // Customer details
        let yPosRight = 145;
        doc
            .fontSize(10)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Billed To:', pageWidth - 250, yPosRight);

        yPosRight += 18;
        doc
            .fontSize(11)
            .fillColor(textPrimary)
            .font('Helvetica-Bold')
            .text(payment.subscription.store.name, pageWidth - 250, yPosRight);

        // Build address from components
        const addressParts = [
            payment.subscription.store.addressLine1,
            payment.subscription.store.addressLine2,
            payment.subscription.store.city,
            payment.subscription.store.state,
            payment.subscription.store.pinCode
        ].filter(Boolean);

        const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text(fullAddress, pageWidth - 250, yPosRight, { width: 200 });

        if (payment.subscription.store.gstin) {
            yPosRight += 15;
            doc.text(`GSTIN: ${payment.subscription.store.gstin}`, pageWidth - 250, yPosRight);
        }

        // Subscription details
        yPos = 270;
        doc
            .moveTo(50, yPos)
            .lineTo(pageWidth - 50, yPos)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        yPos += 20;
        doc
            .fontSize(12)
            .fillColor(textPrimary)
            .font('Helvetica-Bold')
            .text('Subscription Details', 50, yPos);

        yPos += 25;

        // Table header
        doc
            .rect(50, yPos, pageWidth - 100, 25)
            .fillColor('#F9FAFB')
            .fill();

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .font('Helvetica-Bold')
            .text('Description', 60, yPos + 8, { width: 250 });

        doc.text('Period', pageWidth - 300, yPos + 8, { width: 100 });

        doc.text('Amount', pageWidth - 150, yPos + 8, {
            width: 100,
            align: 'right',
        });

        yPos += 25;

        // Subscription item
        const amount = payment.amount || (payment.amountPaise / 100);

        doc
            .fontSize(10)
            .fillColor(textPrimary)
            .font('Helvetica')
            .text(payment.planDisplayName || payment.planName, 60, yPos + 8, { width: 250 });

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .text(payment.billingCycle || 'Monthly', pageWidth - 300, yPos + 8, { width: 100 });

        doc
            .fontSize(10)
            .fillColor(textPrimary)
            .font('Helvetica')
            .text(
                `${payment.currency} ${amount.toFixed(2)}`,
                pageWidth - 150,
                yPos + 8,
                { width: 100, align: 'right' }
            );

        yPos += 30;
        doc
            .moveTo(50, yPos)
            .lineTo(pageWidth - 50, yPos)
            .strokeColor(borderColor)
            .lineWidth(0.5)
            .stroke();

        yPos += 15;

        // Total
        doc
            .rect(pageWidth - 250, yPos - 5, 200, 25)
            .fillColor('#F0FDF4')
            .fill();

        doc
            .fontSize(11)
            .fillColor(primaryColor)
            .font('Helvetica-Bold')
            .text('Total', pageWidth - 250, yPos + 3);

        doc.text(
            `${payment.currency} ${amount.toFixed(2)}`,
            pageWidth - 150,
            yPos + 3,
            { width: 100, align: 'right' }
        );

        yPos += 50;

        // Payment details
        doc
            .moveTo(50, yPos)
            .lineTo(pageWidth - 50, yPos)
            .strokeColor(borderColor)
            .lineWidth(1)
            .stroke();

        yPos += 20;

        doc
            .fontSize(10)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Payment Method:', 50, yPos);

        doc
            .fontSize(10)
            .fillColor(textPrimary)
            .font('Helvetica-Bold')
            .text(payment.method || 'Razorpay', 160, yPos);

        yPos += 18;

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Transaction ID:', 50, yPos);

        doc
            .fontSize(9)
            .fillColor(textPrimary)
            .text(payment.razorpayPaymentId || payment.razorpayOrderId, 160, yPos);

        yPos += 18;

        doc
            .fontSize(9)
            .fillColor(textSecondary)
            .text('Payment Date:', 50, yPos);

        doc
            .fontSize(9)
            .fillColor(textPrimary)
            .text(new Date(payment.completedAt || payment.createdAt).toLocaleDateString('en-IN'), 160, yPos);

        // Footer
        const footerY = doc.page.height - 80;

        doc
            .moveTo(50, footerY)
            .lineTo(pageWidth - 50, footerY)
            .strokeColor(borderColor)
            .lineWidth(0.5)
            .stroke();

        doc
            .fontSize(8)
            .fillColor(textSecondary)
            .font('Helvetica')
            .text('Thank you for your business', 50, footerY + 15, {
                width: pageWidth - 100,
                align: 'center',
            });

        doc.text(
            'This is a computer-generated invoice and does not require a signature',
            50,
            footerY + 30,
            { width: pageWidth - 100, align: 'center' }
        );

        doc.end();

    } catch (error) {
        console.error('[Invoice] Generation failed:', error);
        next(error);
    }
});

module.exports = router;
