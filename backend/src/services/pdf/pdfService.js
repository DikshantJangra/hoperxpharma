const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const UPIQRCode = require('upiqrcode').default;

class PDFService {
    constructor() {
        // No template needed for PDFKit - we'll generate programmatically
    }

    /**
     * Generate Purchase Order PDF
     * @param {Object} po - Purchase Order object with supplier and items
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generatePOPdf(po) {
        return new Promise((resolve, reject) => {
            try {
                console.log('Generating PDF for PO:', po.poNumber);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50,
                    bufferPages: true
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Helper functions
                const formatCurrency = (amount) => {
                    return new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 2
                    }).format(amount || 0);
                };

                const formatDate = (date) => {
                    return date ? moment(date).format('DD-MMM-YYYY') : '';
                };

                // Colors
                const primaryColor = '#2563eb';
                const textColor = '#1f2937';
                const lightGray = '#f3f4f6';

                // Header
                doc.fontSize(20).fillColor(primaryColor).text('PURCHASE ORDER', { align: 'center' });
                doc.moveDown(0.5);
                doc.fontSize(10).fillColor(textColor).text(`PO Number: ${po.poNumber}`, { align: 'center' });
                doc.text(`Date: ${formatDate(po.orderDate)}`, { align: 'center' });
                doc.moveDown(1);

                // Company Info (Left) and Supplier Info (Right)
                const leftX = 50;
                const rightX = 320;
                let currentY = doc.y;

                // From Section
                doc.fontSize(12).fillColor(primaryColor).text('From:', leftX, currentY);
                doc.fontSize(10).fillColor(textColor);
                doc.text(po.store?.displayName || po.store?.name || 'HopeRx', leftX, doc.y);
                doc.text(`${po.store?.addressLine1 || ''}`, leftX, doc.y);
                doc.text(`${po.store?.city || ''}, ${po.store?.state || ''} ${po.store?.pinCode || ''}`, leftX, doc.y);
                if (po.store?.phoneNumber) doc.text(`Ph: ${po.store.phoneNumber}`, leftX, doc.y);
                if (po.store?.gstin) doc.text(`GSTIN: ${po.store.gstin}`, leftX, doc.y);

                // To Section (Supplier)
                doc.fontSize(12).fillColor(primaryColor).text('To:', rightX, currentY);
                doc.fontSize(10).fillColor(textColor);
                doc.text(po.supplier.name, rightX, doc.y - 12);
                doc.text(`${po.supplier.addressLine1 || ''}`, rightX, doc.y);
                doc.text(`${po.supplier.city || ''}`, rightX, doc.y);
                if (po.supplier.phoneNumber) doc.text(`Ph: ${po.supplier.phoneNumber}`, rightX, doc.y);
                if (po.supplier.gstin) doc.text(`GSTIN: ${po.supplier.gstin}`, rightX, doc.y);

                doc.moveDown(2);

                // Table Headers
                const tableTop = doc.y;
                const itemX = 50;
                const qtyX = 280;
                const rateX = 330;
                const gstX = 390;
                const amountX = 450;

                doc.fontSize(9).fillColor(primaryColor);
                doc.text('Item', itemX, tableTop, { width: 220 });
                doc.text('Qty', qtyX, tableTop, { width: 40 });
                doc.text('Rate', rateX, tableTop, { width: 50 });
                doc.text('GST%', gstX, tableTop, { width: 50 });
                doc.text('Amount', amountX, tableTop, { width: 90, align: 'right' });

                doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
                doc.moveDown(0.5);

                // Table Rows
                let subtotal = 0;
                doc.fontSize(8).fillColor(textColor);

                po.items.forEach((item, index) => {
                    const qty = item.quantity;
                    const rate = Number(item.unitPrice);
                    const discount = item.discountPercent || 0;
                    const gstRate = Number(item.gstPercent) || 0;

                    const lineAmount = qty * rate * (1 - discount / 100);
                    subtotal += lineAmount;

                    const y = doc.y;

                    // Item name (with wrapping)
                    doc.text(item.drug?.name || 'Item', itemX, y, { width: 220, lineGap: 2 });
                    const itemHeight = doc.y - y;

                    // Other columns
                    doc.text(qty.toString(), qtyX, y, { width: 40 });
                    doc.text(formatCurrency(rate), rateX, y, { width: 50 });
                    doc.text(`${gstRate}%`, gstX, y, { width: 50 });
                    doc.text(formatCurrency(lineAmount), amountX, y, { width: 90, align: 'right' });

                    doc.y = y + Math.max(itemHeight, 15);

                    // Add page break if needed
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                });

                doc.moveTo(50, doc.y + 5).lineTo(545, doc.y + 5).stroke();
                doc.moveDown(1);

                // Totals
                const totalsX = 380;
                doc.fontSize(9).fillColor(textColor);
                doc.text('Subtotal:', totalsX, doc.y);
                doc.text(formatCurrency(subtotal), amountX, doc.y, { width: 90, align: 'right' });
                doc.moveDown(0.5);

                const totalTax = subtotal * 0.18; // Simplified - should calculate from items
                doc.text('Tax:', totalsX, doc.y);
                doc.text(formatCurrency(totalTax), amountX, doc.y, { width: 90, align: 'right' });
                doc.moveDown(0.5);

                doc.fontSize(11).fillColor(primaryColor);
                doc.text('Grand Total:', totalsX, doc.y);
                doc.text(formatCurrency(subtotal + totalTax), amountX, doc.y, { width: 90, align: 'right' });

                // Footer
                doc.fontSize(8).fillColor(textColor);
                doc.moveDown(2);
                if (po.paymentTerms) {
                    doc.text(`Payment Terms: ${po.paymentTerms}`, 50);
                }

                doc.moveDown(1);
                doc.text('This is a computer-generated document.', { align: 'center' });

                doc.end();
            } catch (error) {
                console.error('PDF Generation Error:', error);
                reject(error);
            }
        });
    }

    /**
     * Generate Sales Invoice PDF
     * @param {Object} sale - Sale object with items, patient, and payment details
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateSaleInvoicePdf(sale) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('Generating Invoice PDF for:', sale.invoiceNumber);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 40,
                    bufferPages: true
                });

                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Helper functions
                const formatCurrency = (amount) => {
                    return new Intl.NumberFormat('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }).format(amount || 0);
                };

                const formatDate = (date) => {
                    return date ? moment(date).format('DD-MM-YY') : '';
                };

                const formatTime = (date) => {
                    return date ? moment(date).format('hh:mm A') : '';
                };

                // Colors
                const primaryColor = '#1e40af';
                const textColor = '#111827';
                const accentColor = '#3b82f6';

                // Header Section
                doc.fontSize(18).fillColor(primaryColor).text(sale.store?.displayName || sale.store?.name || 'Store Name', { align: 'center' });
                doc.fontSize(9).fillColor(textColor);
                doc.text(sale.store?.addressLine1 || '', { align: 'center' });
                doc.text(`${sale.store?.city || ''}, ${sale.store?.state || ''} - ${sale.store?.pinCode || ''}`, { align: 'center' });
                doc.text(`Phone: ${sale.store?.phoneNumber || ''}`, { align: 'center' });
                if (sale.store?.gstin) doc.text(`GSTIN: ${sale.store.gstin}`, { align: 'center' });

                doc.moveDown(0.5);
                doc.fontSize(14).fillColor(primaryColor).text('INVOICE', { align: 'center' });
                doc.moveDown(0.5);

                // Invoice Details
                doc.fontSize(9).fillColor(textColor);
                const leftX = 40;
                const rightX = 350;
                doc.text(`Invoice #: ${sale.invoiceNumber}`, leftX, doc.y);
                doc.text(`Date: ${formatDate(sale.createdAt)} ${formatTime(sale.createdAt)}`, rightX, doc.y, { align: 'right' });
                doc.moveDown(0.5);

                // Patient Info
                if (sale.patient) {
                    console.log('[PDF] Patient data:', JSON.stringify(sale.patient, null, 2));
                    doc.text(`Patient: ${sale.patient.firstName} ${sale.patient.lastName || ''}`, leftX);
                    if (sale.patient.phoneNumber) {
                        doc.text(`Phone: ${sale.patient.phoneNumber}`, leftX);
                    }
                }

                // Add Dispensed For details if they exist and are different from the main patient
                // Add Dispensed For details
                if (sale.dispenseForPatient) {
                    doc.moveDown(0.3);
                    doc.font('Helvetica-Bold').fontSize(9).text('Dispensed For:', leftX);
                    doc.font('Helvetica').fontSize(9).text(`${sale.dispenseForPatient.firstName} ${sale.dispenseForPatient.lastName || ''}`, leftX + 80, doc.y - 12);

                    const details = [];
                    if (sale.dispenseForPatient.age || sale.dispenseForPatient.dateOfBirth) {
                        // Calculate age if DOB is present and age is not
                        let age = sale.dispenseForPatient.age;
                        if (!age && sale.dispenseForPatient.dateOfBirth) {
                            age = moment().diff(sale.dispenseForPatient.dateOfBirth, 'years');
                        }
                        if (age) details.push(`Age: ${age}`);
                    }
                    if (sale.dispenseForPatient.gender) details.push(`Sex: ${sale.dispenseForPatient.gender}`);

                    if (details.length > 0) {
                        doc.text(details.join(', '), leftX + 80, doc.y);
                    }
                    doc.moveDown(0.2);
                }

                if (sale.doctorName) {
                    doc.moveDown(0.2);
                    doc.text(`Prescribed by: ${sale.doctorName}`, leftX);
                }
                doc.moveDown(1);

                // Items Table Header
                const tableTop = doc.y;
                doc.fontSize(8).fillColor(primaryColor);
                doc.rect(leftX, tableTop - 5, 515, 15).fill('#e0e7ff');

                doc.fillColor(textColor);
                doc.fillColor(textColor);
                doc.text('Item', leftX + 5, tableTop, { width: 180 });
                doc.text('Batch', 200, tableTop, { width: 60 });
                doc.text('Exp', 265, tableTop, { width: 40 });
                doc.text('Qty', 310, tableTop, { width: 30 });
                doc.text('MRP', 345, tableTop, { width: 50, align: 'right' });
                doc.text('Disc', 400, tableTop, { width: 40, align: 'right' });
                doc.text('GST', 445, tableTop, { width: 40, align: 'right' });
                doc.text('Total', 490, tableTop, { width: 60, align: 'right' });

                doc.moveDown(0.8);

                // Items
                let totalMrp = 0;
                doc.fontSize(8).fillColor(textColor);

                sale.items.forEach((item, index) => {
                    const y = doc.y;
                    const quantity = Number(item.quantity) || 0;
                    const mrp = Number(item.mrp) || 0;
                    const gstRate = Number(item.gstRate) || 0;
                    const lineTotal = Number(item.lineTotal) || 0;

                    totalMrp += mrp * quantity;

                    // Extract batch number - prefer batchNumber field, fallback to last 6 chars of ID
                    let batchDisplay = '-';
                    console.log('[PDF] Item batch data:', JSON.stringify(item.batch, null, 2));
                    console.log('[PDF] Item batchId:', item.batchId);

                    if (item.batch?.batchNumber) {
                        batchDisplay = item.batch.batchNumber;
                    } else if (item.batchId) {
                        // Fallback: show last 6 characters of batch ID if batchNumber is missing
                        batchDisplay = item.batchId.slice(-6).toUpperCase();
                    }

                    doc.text(item.drug?.name || 'Item', leftX + 5, y, { width: 180 });
                    doc.text(batchDisplay, 200, y, { width: 60 });
                    doc.text(item.batch?.expiryDate ? moment(item.batch.expiryDate).format('MM/YY') : '-', 265, y, { width: 40 });
                    doc.text(quantity.toString(), 310, y, { width: 30 });
                    doc.text(formatCurrency(mrp), 345, y, { width: 50, align: 'right' });
                    const itemDiscount = Number(item.discount) || 0;
                    doc.text(itemDiscount > 0 ? formatCurrency(itemDiscount) : '-', 400, y, { width: 40, align: 'right' });
                    doc.text(`${gstRate}%`, 445, y, { width: 40, align: 'right' });
                    doc.text(formatCurrency(lineTotal), 490, y, { width: 60, align: 'right' });

                    doc.moveDown(0.7);

                    // Page break if needed
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                });

                doc.moveTo(leftX, doc.y).lineTo(555, doc.y).stroke();
                doc.moveDown(1);

                // Totals Section
                const totalsX = 380;
                doc.fontSize(9);

                doc.text('Subtotal:', totalsX, doc.y);
                doc.text('₹ ' + formatCurrency(sale.subtotal), 480, doc.y, { align: 'right' });
                doc.moveDown(0.5);

                if (sale.discountAmount && Number(sale.discountAmount) > 0) {
                    doc.text('Discount:', totalsX, doc.y);
                    doc.text('- ₹ ' + formatCurrency(sale.discountAmount), 480, doc.y, { align: 'right' });
                    doc.moveDown(0.5);
                }

                doc.text('Tax:', totalsX, doc.y);
                doc.text('₹ ' + formatCurrency(sale.taxAmount), 480, doc.y, { align: 'right' });
                doc.moveDown(0.5);

                if (sale.roundOff) {
                    doc.text('Round Off:', totalsX, doc.y);
                    doc.text((Number(sale.roundOff) >= 0 ? '+ ' : '- ') + '₹ ' + Math.abs(Number(sale.roundOff)).toFixed(2), 480, doc.y, { align: 'right' });
                    doc.moveDown(0.5);
                }

                doc.fontSize(11).fillColor(primaryColor);
                doc.text('Grand Total:', totalsX, doc.y);
                doc.text('₹ ' + formatCurrency(sale.total), 480, doc.y, { align: 'right' });
                doc.moveDown(0.5);

                const totalSaving = totalMrp - Number(sale.total);
                if (totalSaving > 0) {
                    doc.fontSize(9).fillColor('#059669');
                    doc.text(`You Saved: ₹ ${formatCurrency(totalSaving)}`, totalsX, doc.y);
                }

                doc.moveDown(1.5);

                // Add UPI QR Code if available
                try {
                    const qrCodeDataUrl = await this.generateUPIQRCode(sale.store, sale.total);
                    if (qrCodeDataUrl) {
                        // Extract base64 data
                        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
                        const imgBuffer = Buffer.from(base64Data, 'base64');

                        // Add QR code to PDF
                        doc.image(imgBuffer, 450, doc.y, { width: 80, height: 80 });
                        doc.fontSize(7).fillColor(textColor);
                        doc.text('Scan to Pay', 460, doc.y + 85, { width: 60, align: 'center' });
                    }
                } catch (qrError) {
                    console.error('Failed to add QR code to PDF:', qrError);
                }

                // Footer
                doc.fontSize(8).fillColor(textColor);
                const footerY = 750;
                doc.text(sale.store?.settings?.footerText || 'Thank you for your business!', leftX, footerY, { align: 'center', width: 515 });
                doc.fontSize(7);
                doc.text(`Billed by: ${await this.getSoldByUserName(sale.soldBy)}`, leftX, footerY + 15, { align: 'center', width: 515 });

                doc.end();
            } catch (error) {
                console.error('Invoice PDF Generation Error:', error);
                reject(error);
            }
        });
    }

    /**
     * Get user name from soldBy ID
     */
    async getSoldByUserName(soldByUserId) {
        if (!soldByUserId) return 'Owner';

        try {
            const prisma = require('../../config/database').getClient();
            const user = await prisma.user.findUnique({
                where: { id: soldByUserId },
                select: { firstName: true, lastName: true }
            });

            if (user) {
                return user.firstName + (user.lastName ? ' ' + user.lastName : '');
            }
            return 'Owner';
        } catch (error) {
            console.error('Error fetching user name for soldBy:', error);
            return 'Owner';
        }
    }

    /**
     * Generate UPI QR Code for payment
     * @param {Object} store - Store object with bankDetails
     * @param {number} amount - Payment amount
     * @returns {Promise<string>} - Base64 data URL of QR code
     */
    async generateUPIQRCode(store, amount) {
        try {
            console.log('=== QR CODE GENERATION ===');
            console.log('Store object:', JSON.stringify({
                id: store?.id,
                name: store?.name,
                bankDetails: store?.bankDetails
            }, null, 2));
            console.log('Amount:', amount);

            // Check if UPI ID is configured
            const upiId = store?.bankDetails?.upiId;
            if (!upiId) {
                console.log('⚠️ No UPI ID configured, skipping QR code generation');
                console.log('Store bankDetails:', store?.bankDetails);
                return '';
            }

            console.log('✓ UPI ID found:', upiId);

            // Generate QR code
            const result = await UPIQRCode({
                payeeVPA: upiId,
                payeeName: store.displayName || store.name,
                amount: amount.toString(),
                transactionNote: 'Invoice Payment',
            });

            console.log('✓ QR Code generated successfully');
            return result.qr;
        } catch (error) {
            console.error('❌ QR Code Generation Error:', error);
            return '';
        }
    }
}

module.exports = new PDFService();
