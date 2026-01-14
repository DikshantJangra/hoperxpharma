const PDFDocument = require('pdfkit');
const logger = require('../../config/logger');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const UPIQRCode = require('upiqrcode').default;
const axios = require('axios');

const sharp = require('sharp');
const prisma = require('../../db/prisma');

class PDFService {
    constructor() {
        // No template needed for PDFKit - we'll generate programmatically
    }

    /**
     * Helper to fetch image from URL and convert to PNG (PDFKit only supports PNG/JPEG, not WebP)
     */
    async fetchImage(url) {
        if (!url) return null;
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
            const imageBuffer = Buffer.from(response.data);

            // Convert to PNG using sharp (PDFKit doesn't support WebP)
            // This handles WebP, JPEG, PNG, etc. and outputs a consistent PNG for PDF embedding
            const pngBuffer = await sharp(imageBuffer)
                .png()
                .toBuffer();

            logger.info(`Successfully fetched and converted image from ${url} (${pngBuffer.length} bytes)`);
            return pngBuffer;
        } catch (error) {
            logger.warn(`Failed to fetch/convert image from ${url}:`, error.message);
            return null;
        }
    }

    /**
     * Generate Purchase Order PDF
     * @param {Object} po - Purchase Order object with supplier and items
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generatePOPdf(po) {
        return new Promise((resolve, reject) => {
            try {
                logger.info('Generating PDF for PO:', po.poNumber);

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
                logger.error('PDF Generation Error:', error);
                reject(error);
            }
        });
    }

    /**
     * Generate Sales Invoice PDF - Professional Pharmacy Design
     * @param {Object} sale - Sale object with items, patient, and payment details
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateSaleInvoicePdf(sale) {
        return new Promise(async (resolve, reject) => {
            try {
                logger.info('Generating Invoice PDF for:', sale.invoiceNumber);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 30,
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

                // Colors - BLACK AND WHITE THEME
                const primaryColor = '#000000'; // Black
                const textColor = '#000000';     // Black
                const textLight = '#404040';     // Dark Gray (for less emphasis)
                const borderColor = '#CCCCCC';   // Light Gray for lines (still printable)

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;
                const margin = 30;
                const contentWidth = pageWidth - (margin * 2);

                // ============================================================
                // HEADER SECTION
                // ============================================================
                let yPos = margin;
                const rightColWidth = 220; // Increased to 220 for very long invoice numbers
                const colGap = 15;
                const leftColMaxX = pageWidth - margin - rightColWidth - colGap;

                // QR Code and Invoice info (Render Right side first to know top constraints or just define bounds)
                let invoiceY = margin;
                const qrSize = 55;
                const qrX = pageWidth - margin - qrSize;
                const invoiceTextX = pageWidth - margin - rightColWidth;

                // 1. Render QR Code
                try {
                    const qrCodeDataUrl = await this.generateUPIQRCode(sale.store, sale.total);
                    if (qrCodeDataUrl) {
                        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
                        const imgBuffer = Buffer.from(base64Data, 'base64');
                        doc.image(imgBuffer, qrX, invoiceY, { width: qrSize, height: qrSize });
                        doc.fontSize(6).fillColor(textColor);
                        doc.text('Scan to Pay', qrX, invoiceY + qrSize + 2, { width: qrSize, align: 'center' });
                    }
                } catch (qrError) {
                    logger.warn('Could not generate QR code:', qrError.message);
                }

                // 2. Render Invoice details (Right top)
                doc.y = invoiceY;
                const detailsTextWidth = rightColWidth - (qrSize + 15);

                doc.fontSize(12).fillColor(textColor).font('Helvetica-Bold');
                doc.text('Invoice', invoiceTextX, doc.y, { width: detailsTextWidth, align: 'right' });

                doc.fontSize(9).fillColor(primaryColor).font('Helvetica-Bold');
                doc.text(sale.invoiceNumber || '-', invoiceTextX, doc.y, { width: detailsTextWidth, align: 'right' });

                const paymentMethod = sale.paymentSplits?.[0]?.paymentMethod || 'Cash';
                doc.fontSize(8).font('Helvetica').fillColor(textColor);
                doc.text(`Payment: ${paymentMethod}`, invoiceTextX, doc.y + 2, { width: detailsTextWidth, align: 'right' });

                doc.text(`${formatDate(sale.createdAt)} ${formatTime(sale.createdAt)}`, invoiceTextX, doc.y, { width: detailsTextWidth, align: 'right' });
                const rightSideBottom = Math.max(doc.y, margin + qrSize);

                // 3. Store Info (Left section)
                doc.y = margin;
                let logoEndX = margin;
                if (sale.store?.logoUrl) {
                    try {
                        const logoBuffer = await this.fetchImage(sale.store.logoUrl);
                        if (logoBuffer) {
                            doc.image(logoBuffer, margin, doc.y, { fit: [60, 60] });
                            logoEndX = margin + 75;
                        }
                    } catch (e) { logger.warn('Could not load store logo'); }
                }

                const storeInfoX = logoEndX;
                const leftColWidth = leftColMaxX - storeInfoX;

                doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold');
                doc.text(sale.store?.displayName || sale.store?.name || 'Pharmacy Name', storeInfoX, margin, { width: leftColWidth });

                doc.fontSize(9).fillColor(textColor).font('Helvetica');
                const addressParts = [
                    sale.store?.addressLine1,
                    sale.store?.city,
                    sale.store?.state,
                    sale.store?.pinCode
                ].filter(Boolean).join(', ');

                if (addressParts) doc.text(addressParts, storeInfoX, doc.y, { width: leftColWidth });

                if (sale.store?.phoneNumber) {
                    doc.font('Helvetica-Bold').text(`Phone: `, storeInfoX, doc.y, { continued: true });
                    doc.font('Helvetica').text(sale.store.phoneNumber);
                }
                // Move reg details below the main header row to have more width
                const currentHeaderBottom = Math.max(doc.y, rightSideBottom);
                doc.y = currentHeaderBottom + 4;

                doc.fontSize(7.5).fillColor(textLight || textColor).font('Helvetica');
                const regDetails = [];
                if (sale.store?.dlNumber) regDetails.push(`DL: ${sale.store.dlNumber}`);
                if (sale.store?.gstin) regDetails.push(`GSTIN: ${sale.store.gstin}`);
                if (sale.store?.pan) regDetails.push(`PAN: ${sale.store.pan}`);

                if (regDetails.length > 0) {
                    doc.text(regDetails.join('   |   '), margin, doc.y, { width: contentWidth, align: 'left' });
                }

                // 4. Final Header Y
                yPos = doc.y + 12;
                doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).strokeColor(primaryColor).lineWidth(1.5).stroke();
                yPos += 10;

                // ============================================================
                // PATIENT SECTION
                // ============================================================
                const patientColX = margin;
                const patientColWidth = (pageWidth - 2 * margin) * 0.7;
                const refColX = margin + patientColWidth + 10;
                const refColWidth = pageWidth - margin - refColX;

                const patientName = sale.dispenseForPatient
                    ? `${sale.dispenseForPatient.firstName} ${sale.dispenseForPatient.lastName || ''}`
                    : sale.patient
                        ? `${sale.patient.firstName} ${sale.patient.lastName || ''}`
                        : 'Walk-in Customer';

                const patientGender = sale.dispenseForPatient?.gender?.[0] || sale.patient?.gender?.[0] || '';
                const patientPhone = sale.dispenseForPatient?.phoneNumber || sale.patient?.phoneNumber || '';

                let patientText = patientName;
                if (patientGender) patientText += ` (${patientGender})`;
                if (patientPhone) patientText += `  |  ${patientPhone}`;

                doc.fontSize(9).fillColor(textColor).font('Helvetica-Bold');
                doc.text('Patient: ', patientColX, yPos, { continued: true, width: patientColWidth });
                doc.font('Helvetica').text(patientText);
                const patientBottom = doc.y;

                if (sale.doctorName) {
                    doc.font('Helvetica-Bold').text('Ref. By: ', refColX, yPos, { continued: true, width: refColWidth, align: 'right' });
                    doc.font('Helvetica').text(sale.doctorName);
                }
                const refBottom = doc.y;

                yPos = Math.max(patientBottom, refBottom) + 8;
                doc.moveTo(margin, yPos).lineTo(pageWidth - margin, yPos).strokeColor(borderColor).lineWidth(0.5).stroke();
                yPos += 8;

                // ============================================================
                // ITEMS TABLE
                // ============================================================
                const tableTop = yPos;
                const colWidths = {
                    sr: 20,
                    medicines: 115,
                    hsn: 40,
                    packing: 35,
                    batch: 65,
                    exp: 35,
                    mrp: 45,
                    qty: 25,
                    disc: 30,
                    gst: 30,
                    amount: 55
                };

                // Table Header with BLACK background
                doc.rect(margin, tableTop, contentWidth, 18).fill(primaryColor);

                doc.fontSize(7).fillColor('#FFFFFF').font('Helvetica-Bold');
                let colX = margin + 2;

                doc.text('Sr.', colX, tableTop + 5, { width: colWidths.sr });
                colX += colWidths.sr;
                doc.text('Medicines', colX, tableTop + 5, { width: colWidths.medicines });
                colX += colWidths.medicines;
                doc.text('HSN', colX, tableTop + 5, { width: colWidths.hsn, align: 'center' });
                colX += colWidths.hsn;
                doc.text('Pack', colX, tableTop + 5, { width: colWidths.packing, align: 'center' });
                colX += colWidths.packing;
                doc.text('Batch', colX, tableTop + 5, { width: colWidths.batch, align: 'center' });
                colX += colWidths.batch;
                doc.text('Exp', colX, tableTop + 5, { width: colWidths.exp, align: 'center' });
                colX += colWidths.exp;
                doc.text('MRP', colX, tableTop + 5, { width: colWidths.mrp, align: 'right' });
                colX += colWidths.mrp;
                doc.text('Qty', colX, tableTop + 5, { width: colWidths.qty, align: 'center' });
                colX += colWidths.qty;
                doc.text('Disc%', colX, tableTop + 5, { width: colWidths.disc, align: 'center' });
                colX += colWidths.disc;
                doc.text('GST%', colX, tableTop + 5, { width: colWidths.gst, align: 'center' });
                colX += colWidths.gst;
                doc.text('Amount', colX, tableTop + 5, { width: colWidths.amount, align: 'right' });

                yPos = tableTop + 20;

                // Table Rows
                let totalMrp = 0;
                let totalItems = 0;
                let totalDiscount = 0;
                doc.font('Helvetica').fillColor(textColor);

                sale.items.forEach((item, index) => {
                    const quantity = Number(item.quantity) || 0;
                    const mrp = Number(item.mrp) || 0;
                    const gstRate = Number(item.gstRate) || 0;
                    const discountPercent = Number(item.discountPercent) || 0;
                    const lineTotal = Number(item.lineTotal) || 0;
                    const lineDiscount = (mrp * quantity * discountPercent) / 100;

                    totalMrp += mrp * quantity;
                    totalItems += quantity;
                    totalDiscount += lineDiscount;

                    // Batch display
                    let batchDisplay = '-';
                    if (item.batch?.batchNumber) {
                        batchDisplay = item.batch.batchNumber;
                    } else if (item.batchId) {
                        batchDisplay = item.batchId.slice(-5).toUpperCase();
                    }

                    // Expiry display
                    const expiryDisplay = item.batch?.expiryDate ? moment(item.batch.expiryDate).format('MM/YY') : '-';

                    // Packing info
                    const packingDisplay = item.drug?.packSize || item.packSize || '1s';

                    // HSN Code
                    const hsnDisplay = item.drug?.hsnCode || item.hsnCode || '-';

                    doc.fontSize(7);
                    colX = margin + 2;

                    // Mark Rx for prescribed medicines
                    const isPrescribed = item.drug?.requiresPrescription || item.isPrescribed;
                    const medicineName = isPrescribed ? `Rx ${item.drug?.name || 'Item'}` : (item.drug?.name || 'Item');

                    // Calculate row height based on content
                    const medHeight = doc.heightOfString(medicineName, { width: colWidths.medicines });
                    const batchHeight = doc.heightOfString(batchDisplay, { width: colWidths.batch });
                    const currentRowHeight = Math.max(12, medHeight, batchHeight) + 4; // Padding

                    // Render columns
                    doc.text((index + 1).toString(), colX, yPos, { width: colWidths.sr });
                    colX += colWidths.sr;

                    doc.text(medicineName, colX, yPos, { width: colWidths.medicines });
                    colX += colWidths.medicines;
                    doc.text(hsnDisplay, colX, yPos, { width: colWidths.hsn, align: 'center' });
                    colX += colWidths.hsn;
                    doc.text(packingDisplay, colX, yPos, { width: colWidths.packing, align: 'center' });
                    colX += colWidths.packing;
                    doc.text(batchDisplay, colX, yPos, { width: colWidths.batch, align: 'center' });
                    colX += colWidths.batch;
                    doc.text(expiryDisplay, colX, yPos, { width: colWidths.exp, align: 'center' });
                    colX += colWidths.exp;
                    doc.text(formatCurrency(mrp), colX, yPos, { width: colWidths.mrp, align: 'right' });
                    colX += colWidths.mrp;
                    doc.text(quantity.toString(), colX, yPos, { width: colWidths.qty, align: 'center' });
                    colX += colWidths.qty;
                    doc.text(discountPercent > 0 ? `${discountPercent}%` : '-', colX, yPos, { width: colWidths.disc, align: 'center' });
                    colX += colWidths.disc;
                    doc.text(`${gstRate}%`, colX, yPos, { width: colWidths.gst, align: 'center' });
                    colX += colWidths.gst;
                    doc.text(formatCurrency(lineTotal), colX, yPos, { width: colWidths.amount, align: 'right' });

                    yPos += currentRowHeight;

                    // Row separator
                    doc.moveTo(margin, yPos - 2).lineTo(pageWidth - margin, yPos - 2).strokeColor(borderColor).lineWidth(0.3).stroke();

                    // Page break if needed
                    if (yPos > pageHeight - 50) {
                        doc.addPage();
                        yPos = margin;
                    }
                });

                // ============================================================
                // FOOTER SECTION (Summary & Signoff)
                // ============================================================
                // Calculate required space for footer (approx 150-200px)
                const footerHeight = 180;

                // If not enough space on current page, add new page
                // We use dynamic positioning now instead of fixed bottom positioning
                // This ensures it flows right after items if there is space, 
                // or moves to top of next page if not.
                if (yPos + footerHeight > pageHeight - margin) {
                    doc.addPage();
                    yPos = margin;
                } else {
                    yPos += 20; // Add some spacing after table
                }

                // Reference Y for the footer block
                let footerY = yPos;

                // Top border of footer
                doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor(textColor).lineWidth(0.5).stroke();

                // --- LEFT SIDE: Terms & Conditions + Signature ---
                const termsX = margin;
                let termsY = footerY + 10;

                doc.fontSize(9).fillColor(textColor).font('Helvetica-Bold');
                doc.text('Terms & Conditions', termsX, termsY);
                termsY += 12;

                doc.fontSize(7).font('Helvetica');
                doc.text('1. Goods once sold will not be taken back.', termsX, termsY);
                termsY += 10;
                doc.text('2. Prescription drugs are sold against valid prescription only.', termsX, termsY);
                termsY += 25;

                // Authorized Signatory BELOW Terms & Conditions
                const signAreaY = termsY;
                const signCenterX = termsX + 80; // Centered under terms

                // Try to embed Signature Image (BIGGER)
                if (sale.store?.signatureUrl) {
                    try {
                        const sigBuffer = await this.fetchImage(sale.store.signatureUrl);
                        if (sigBuffer) {
                            doc.image(sigBuffer, signCenterX - 50, signAreaY, {
                                fit: [100, 50],
                                align: 'center'
                            });
                        }
                    } catch (e) {
                        logger.warn('Could not load signature', e.message);
                    }
                }

                doc.moveTo(signCenterX - 60, signAreaY + 55).lineTo(signCenterX + 60, signAreaY + 55).strokeColor(textColor).lineWidth(0.5).stroke();
                doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor);
                doc.text('Authorized Signatory', signCenterX - 60, signAreaY + 60, { width: 120, align: 'center' });

                // --- RIGHT SIDE: All Calculations ---
                const rightX = pageWidth - margin - 150;
                let rightY = footerY + 10;

                // GST values (already included in sale.total)
                const cgstAmount = Number(sale.cgstAmount) || (Number(sale.taxAmount) / 2) || 0;
                const sgstAmount = Number(sale.sgstAmount) || (Number(sale.taxAmount) / 2) || 0;
                const totalGst = cgstAmount + sgstAmount;
                const roundOff = Number(sale.roundOff) || 0;
                const totalSaving = totalMrp - Number(sale.total);
                // Taxable value = Net Payable - GST (since GST is included in total)
                const taxableValue = Number(sale.total) - totalGst;

                doc.fontSize(8).font('Helvetica').fillColor(textColor);

                // Total Items
                doc.text('Total Item(s)', rightX, rightY, { width: 75 });
                doc.text(totalItems.toString(), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 11;

                // Total MRP
                doc.text('Total MRP', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(totalMrp), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 11;

                // Discount
                if (totalDiscount > 0) {
                    doc.text('Discount', rightX, rightY, { width: 75 });
                    doc.text(`- ${formatCurrency(totalDiscount)}`, rightX + 75, rightY, { width: 70, align: 'right' });
                    rightY += 11;
                }

                // Subtotal after discount (before GST breakdown)
                doc.fillColor(textColor);
                doc.text('Subtotal', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(totalMrp - totalDiscount), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 11;

                // GST Breakdown (informational - already included above)
                doc.fillColor(textLight).fontSize(7);
                doc.text('(Incl. GST breakdown)', rightX, rightY, { width: 145, align: 'left' });
                rightY += 10;

                doc.fontSize(8);
                doc.text('  CGST', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(cgstAmount), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 10;

                doc.text('  SGST', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(sgstAmount), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 10;

                doc.text('  Taxable Value', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(taxableValue), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 11;

                // Round off
                doc.fillColor(textColor);
                doc.text('Round off', rightX, rightY, { width: 75 });
                doc.text(formatCurrency(Math.abs(roundOff)), rightX + 75, rightY, { width: 70, align: 'right' });
                rightY += 15;

                // NET PAYABLE (prominent)
                doc.moveTo(rightX, rightY - 3).lineTo(rightX + 145, rightY - 3).strokeColor(primaryColor).lineWidth(1.5).stroke();
                doc.font('Helvetica-Bold').fontSize(10).fillColor(textColor);
                doc.text('NET PAYABLE', rightX, rightY + 3);

                doc.fontSize(14).fillColor(primaryColor);
                doc.text(`Rs. ${formatCurrency(sale.total)}`, rightX, rightY, { width: 145, align: 'right' });

                // Track where the total ended to avoid overlap with Billed By
                rightY = Math.max(rightY + 22, doc.y + 10);

                // Total Saving
                if (totalSaving > 0) {
                    doc.fontSize(8).font('Helvetica').fillColor(textLight);
                    doc.text(`You Saved: Rs. ${formatCurrency(totalSaving)}`, rightX, rightY, { width: 145, align: 'right' });
                    rightY += 12;
                }

                // Billed By
                const billedByName = await this.getSoldByUserName(sale.soldBy);
                doc.fontSize(7).font('Helvetica').fillColor(textLight);
                doc.text(`Billed By: ${billedByName}`, rightX, rightY, { width: 145, align: 'right' });

                // ============================================================
                // THANK YOU MESSAGE
                // ============================================================
                const finalY = Math.max(signAreaY + 80, rightY + 20);

                doc.moveTo(margin, finalY).lineTo(pageWidth - margin, finalY).strokeColor(borderColor).lineWidth(0.5).stroke();

                doc.fontSize(10).fillColor(textColor).font('Helvetica');
                const footerText = sale.store?.settings?.footerText || sale.storeSettings?.footerText || 'Thank you for choosing us!';
                doc.text(footerText, margin, finalY + 10, { width: contentWidth, align: 'center' });

                doc.end();
            } catch (error) {
                logger.error('Invoice PDF Generation Error:', error);
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

            const user = await prisma.user.findUnique({
                where: { id: soldByUserId },
                select: { firstName: true, lastName: true }
            });

            if (user) {
                return user.firstName + (user.lastName ? ' ' + user.lastName : '');
            }
            return 'Owner';
        } catch (error) {
            logger.error('Error fetching user name for soldBy:', error);
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
            logger.info('=== QR CODE GENERATION ===');
            logger.info('Store object:', JSON.stringify({
                id: store?.id,
                name: store?.name,
                bankDetails: store?.bankDetails
            }, null, 2));
            logger.info('Amount:', amount);

            // Check if UPI ID is configured
            const upiId = store?.bankDetails?.upiId;
            if (!upiId) {
                logger.info('⚠️ No UPI ID configured, skipping QR code generation');
                logger.info('Store bankDetails:', store?.bankDetails);
                return '';
            }

            logger.info('✓ UPI ID found:', upiId);

            // Generate QR code
            const result = await UPIQRCode({
                payeeVPA: upiId,
                payeeName: store.displayName || store.name,
                amount: amount.toString(),
                transactionNote: 'Invoice Payment',
            });

            logger.info('✓ QR Code generated successfully');
            return result.qr;
        } catch (error) {
            logger.error('❌ QR Code Generation Error:', error);
            return '';
        }
    }
}

module.exports = new PDFService();
