/**
 * Subscription Invoice PDF Generator
 * Premium, small, precise invoice for subscription payments
 * Using PDFKit for generation
 */

import PDFDocument from 'pdfkit';

export interface SubscriptionInvoiceData {
    invoiceNumber: string;
    invoiceDate: Date;
    paymentDate: Date;

    // Subscription details
    planName: string;
    billingPeriod: string; // e.g., "Monthly", "Yearly"
    subscriptionId: string;

    // Pricing
    subtotal: number;
    tax: number;
    total: number;
    currency: string; // e.g., "INR", "USD"

    // Payment details
    paymentMethod: string; // e.g., "Razorpay", "Card ending in 1234"
    transactionId: string;
    paymentStatus: 'PAID' | 'PENDING' | 'FAILED';

    // Business details
    businessName: string;
    businessAddress: string;
    businessGSTIN?: string;
    businessPAN?: string;

    // Customer details
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
}

/**
 * Generate a premium subscription invoice PDF
 */
export async function generateSubscriptionInvoicePDF(
    data: SubscriptionInvoiceData
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });

            const chunks: Buffer[] = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Premium color scheme
            const primaryColor = '#047857'; // Emerald
            const textPrimary = '#111827';
            const textSecondary = '#6B7280';
            const borderColor = '#E5E7EB';

            // Header with brand
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

            // Invoice number and date (right-aligned)
            const pageWidth = doc.page.width;
            doc
                .fontSize(10)
                .fillColor(textPrimary)
                .font('Helvetica-Bold')
                .text(`Invoice #${data.invoiceNumber}`, pageWidth - 200, 50, {
                    width: 150,
                    align: 'right',
                });

            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text(
                    `Date: ${data.invoiceDate.toLocaleDateString('en-IN')}`,
                    pageWidth - 200,
                    65,
                    { width: 150, align: 'right' }
                );

            // Status badge
            const statusColor =
                data.paymentStatus === 'PAID'
                    ? '#10B981'
                    : data.paymentStatus === 'PENDING'
                        ? '#F59E0B'
                        : '#EF4444';

            doc
                .fontSize(8)
                .fillColor(statusColor)
                .font('Helvetica-Bold')
                .text(data.paymentStatus, pageWidth - 200, 85, {
                    width: 150,
                    align: 'right',
                });

            // Divider line
            doc
                .moveTo(50, 120)
                .lineTo(pageWidth - 50, 120)
                .strokeColor(borderColor)
                .lineWidth(1)
                .stroke();

            let yPos = 145;

            // Business details (left column)
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
                .text(data.businessName, 50, yPos);

            yPos += 15;
            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text(data.businessAddress, 50, yPos, { width: 200 });

            if (data.businessGSTIN) {
                yPos += 30;
                doc.text(`GSTIN: ${data.businessGSTIN}`, 50, yPos);
            }

            if (data.businessPAN) {
                yPos += 15;
                doc.text(`PAN: ${data.businessPAN}`, 50, yPos);
            }

            // Customer details (right column)
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
                .text(data.customerName, pageWidth - 250, yPosRight);

            yPosRight += 15;
            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text(data.customerEmail, pageWidth - 250, yPosRight);

            if (data.customerPhone) {
                yPosRight += 15;
                doc.text(data.customerPhone, pageWidth - 250, yPosRight);
            }

            // Subscription details section
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

            // Table header background
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
            doc
                .fontSize(10)
                .fillColor(textPrimary)
                .font('Helvetica')
                .text(data.planName, 60, yPos + 8, { width: 250 });

            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .text(data.billingPeriod, pageWidth - 300, yPos + 8, { width: 100 });

            doc
                .fontSize(10)
                .fillColor(textPrimary)
                .font('Helvetica')
                .text(
                    `${data.currency} ${data.subtotal.toFixed(2)}`,
                    pageWidth - 150,
                    yPos + 8,
                    { width: 100, align: 'right' }
                );

            yPos += 30;

            // Divider
            doc
                .moveTo(50, yPos)
                .lineTo(pageWidth - 50, yPos)
                .strokeColor(borderColor)
                .lineWidth(0.5)
                .stroke();

            yPos += 15;

            // Subtotal
            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text('Subtotal', pageWidth - 250, yPos);

            doc
                .fontSize(10)
                .fillColor(textPrimary)
                .text(
                    `${data.currency} ${data.subtotal.toFixed(2)}`,
                    pageWidth - 150,
                    yPos,
                    { width: 100, align: 'right' }
                );

            yPos += 20;

            // Tax
            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text('Tax', pageWidth - 250, yPos);

            doc
                .fontSize(10)
                .fillColor(textPrimary)
                .text(`${data.currency} ${data.tax.toFixed(2)}`, pageWidth - 150, yPos, {
                    width: 100,
                    align: 'right',
                });

            yPos += 25;

            // Total (highlighted)
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
                `${data.currency} ${data.total.toFixed(2)}`,
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
                .text(data.paymentMethod, 160, yPos);

            yPos += 18;

            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .font('Helvetica')
                .text('Transaction ID:', 50, yPos);

            doc
                .fontSize(9)
                .fillColor(textPrimary)
                .text(data.transactionId, 160, yPos);

            yPos += 18;

            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .text('Payment Date:', 50, yPos);

            doc
                .fontSize(9)
                .fillColor(textPrimary)
                .text(data.paymentDate.toLocaleDateString('en-IN'), 160, yPos);

            yPos += 18;

            doc
                .fontSize(9)
                .fillColor(textSecondary)
                .text('Subscription ID:', 50, yPos);

            doc
                .fontSize(9)
                .fillColor(textPrimary)
                .text(data.subscriptionId, 160, yPos);

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
            reject(error);
        }
    });
}
