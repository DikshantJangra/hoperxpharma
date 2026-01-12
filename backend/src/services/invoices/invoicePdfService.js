const PDFDocument = require('pdfkit');
const prisma = require('../../db/prisma');
const axios = require('axios');
const sharp = require('sharp');

/**
 * Generate a professional supplier invoice PDF
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateInvoicePdf(invoiceId) {
    // Fetch invoice with all details
    const invoice = await prisma.consolidatedInvoice.findUnique({
        where: { id: invoiceId },
        include: {
            supplier: true,
            items: true
        }
    });

    if (!invoice) {
        throw new Error('Invoice not found');
    }

    // Fetch store details with all fields
    const store = await prisma.store.findUnique({
        where: { id: invoice.storeId },
        select: {
            id: true,
            name: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            pinCode: true,
            phoneNumber: true,
            email: true,
            gstin: true,
            dlNumber: true,
            pan: true,
            logoUrl: true,
            signatureUrl: true
        }
    });

    // Fetch images in parallel
    const [logoBuffer, signatureBuffer] = await Promise.all([
        fetchImage(store?.logoUrl),
        fetchImage(store?.signatureUrl)
    ]);

    // Generate proper invoice number if still in DRAFT format
    let displayInvoiceNumber = invoice.invoiceNumber;
    if (invoice.invoiceNumber.startsWith('DRAFT-')) {
        // Get counter for this store
        const count = await prisma.consolidatedInvoice.count({
            where: {
                storeId: invoice.storeId,
                status: { not: 'DRAFT' }
            }
        });
        displayInvoiceNumber = `SI-${String(count + 1).padStart(4, '0')}`;
    }

    // Group items by GRN
    const itemsByGrn = {};
    for (const item of invoice.items) {
        const grnNumber = item.grnNumber || 'NO-GRN';
        if (!itemsByGrn[grnNumber]) {
            itemsByGrn[grnNumber] = {
                grn: grnNumber,
                po: item.poNumber,
                receivedDate: item.receivedDate,
                items: []
            };
        }
        itemsByGrn[grnNumber].items.push(item);
    }

    // Attach data to invoice
    invoice.store = store;
    invoice.logoBuffer = logoBuffer;
    invoice.signatureBuffer = signatureBuffer;
    invoice.displayInvoiceNumber = displayInvoiceNumber;
    invoice.groupedItems = Object.values(itemsByGrn);

    // Construct full address
    if (store) {
        const parts = [
            store.addressLine1,
            store.addressLine2,
            `${store.city}, ${store.state} - ${store.pinCode}`
        ].filter(Boolean);
        invoice.storeAddress = parts.join(', ');
    }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Generate PDF content
            addHeader(doc, invoice);
            addInvoiceInfo(doc, invoice);
            const supplierEndY = addSupplierDetails(doc, invoice);
            addItemsTableGrouped(doc, invoice, supplierEndY + 20);
            addTaxAndPaymentSummary(doc, invoice);
            addFooter(doc, invoice);
            addWatermark(doc, invoice);

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Fetch image from URL and convert to PNG (PDFKit requirement)
 */
async function fetchImage(url) {
    if (!url) return null;
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
        const imageBuffer = Buffer.from(response.data);

        // Convert to PNG using sharp (PDFKit doesn't support WebP)
        const pngBuffer = await sharp(imageBuffer)
            .png()
            .toBuffer();

        return pngBuffer;
    } catch (error) {
        console.warn('Failed to fetch/convert image:', url, error.message);
        return null;
    }
}

/**
 * Add company header
 */
function addHeader(doc, invoice) {
    const store = invoice.store;
    let y = 40;

    // Logo
    if (invoice.logoBuffer) {
        try {
            doc.image(invoice.logoBuffer, 40, y, { width: 60 });
        } catch (e) {
            console.warn('Failed to render logo');
        }
    }

    // Render Tax Invoice Label (Right side)
    const labelX = 400;
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', labelX, y, { align: 'right' });
    const rightSideBottom = doc.y;

    // Company name (offset if logo exists)
    const storeInfoX = invoice.logoBuffer ? 110 : 40;
    const leftColWidth = labelX - storeInfoX - 10;

    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text(store?.name || 'Pharmacy Name', storeInfoX, y, { width: leftColWidth });

    // Store details
    doc.fontSize(9).font('Helvetica');

    if (invoice.storeAddress) {
        doc.text(invoice.storeAddress, storeInfoX, doc.y, { width: leftColWidth });
    }

    if (store?.phoneNumber) {
        doc.text(`Phone: ${store.phoneNumber}`, storeInfoX, doc.y);
    }
    if (store?.gstin) {
        doc.text(`GSTIN: ${store.gstin}`, storeInfoX, doc.y);
    }
    if (store?.dlNumber) {
        doc.text(`DL No: ${store.dlNumber}`, storeInfoX, doc.y);
    }

    // Ensure we are below everything in the header
    y = Math.max(doc.y, rightSideBottom, 110);

    // Line separator
    doc.moveTo(40, y)
        .lineTo(555, y)
        .stroke();

    doc.y = y + 10;
}

/**
 * Add invoice information
 */
function addInvoiceInfo(doc, invoice) {
    let yPos = 145;
    doc.fontSize(10);

    const addRow = (label, value, labelX, valueX, currentY) => {
        doc.font('Helvetica-Bold').text(label, labelX, currentY);
        doc.font('Helvetica').text(value, valueX, currentY);
        return doc.y + 3;
    };

    let leftY = yPos;
    let rightY = yPos;

    leftY = addRow('Invoice Number:', invoice.displayInvoiceNumber, 50, 150, leftY);
    leftY = addRow('Invoice Date:', formatDate(invoice.invoiceDate), 50, 150, leftY);
    leftY = addRow('Billing Period:', `${formatDate(invoice.periodStart)} to ${formatDate(invoice.periodEnd)}`, 50, 150, leftY);

    // Right column
    rightY = addRow('Status:', invoice.status, 350, 460, rightY);
    rightY = addRow('Payment Status:', invoice.paymentStatus, 350, 460, rightY);

    doc.y = Math.max(leftY, rightY) + 20;
}

/**
 * Add supplier details
 */
function addSupplierDetails(doc, invoice) {
    const y = 210;
    const supplier = invoice.supplier;

    doc.fontSize(11).font('Helvetica-Bold')
        .text('Bill To:', 50, y);

    let lineY = y + 15;
    doc.fontSize(10).font('Helvetica');

    doc.text(supplier.name, 50, lineY);
    lineY += 13;

    // Construct address
    const addressParts = [
        supplier.addressLine1,
        supplier.addressLine2,
        (supplier.city || supplier.state) ? `${supplier.city || ''}, ${supplier.state || ''} ${supplier.pinCode || ''}` : null
    ].filter(Boolean);

    const fullAddress = addressParts.join(', ');
    if (fullAddress) {
        doc.text(fullAddress, 50, lineY, { width: 300 });
        lineY += 13;
        // Adjust for wrapping if address is long
        if (fullAddress.length > 60) lineY += 10;
    }

    if (supplier.phoneNumber) {
        doc.text(`Phone: ${supplier.phoneNumber}`, 50, lineY);
        lineY += 13;
    }
    if (supplier.gstin) {
        doc.text(`GSTIN: ${supplier.gstin}`, 50, lineY);
        lineY += 13;
    }
    if (supplier.dlNumber) {
        doc.text(`DL No: ${supplier.dlNumber}`, 50, lineY);
        lineY += 13;
    }

    // Add some margin below supplier info
    lineY += 8;

    // Line separator
    doc.moveTo(50, lineY + 5)
        .lineTo(545, lineY + 5)
        .stroke();

    return lineY + 10;
}



/**
 * Add items table grouped by GRN
 */
function addItemsTableGrouped(doc, invoice, startY) {
    let y = startY || 295;
    const lineHeight = 20;
    let itemIndex = 1;

    // Table header
    drawTableHeader(doc, y);
    y += 25;

    // Iterate through GRN groups
    invoice.groupedItems.forEach((group, groupIdx) => {
        // Check if we need a new page for GRN header
        if (y > 680) {
            doc.addPage();
            y = 50;
            drawTableHeader(doc, y);
            y += 25;
        }

        // GRN separator row
        doc.fontSize(8).font('Helvetica-Bold');
        doc.fillColor('#0066cc');
        doc.rect(50, y, 495, 18).fillAndStroke('#e6f2ff', '#0066cc');
        doc.fillColor('#000');

        const grnText = `GRN: ${group.grn}${group.po ? ' | PO: ' + group.po : ''}${group.receivedDate ? ' | Received: ' + formatDate(group.receivedDate) : ''} `;
        doc.text(grnText, 55, y + 5, { width: 485 });
        y += 18;

        // Items in this GRN
        group.items.forEach((item) => {
            // Check if we need a new page
            if (y > 700) {
                doc.addPage();
                y = 50;
                drawTableHeader(doc, y);
                y += 25;
            }

            drawTableRow(doc, item, itemIndex, y);
            y += lineHeight;
            itemIndex++;
        });
    });

    // Draw table bottom line
    doc.moveTo(50, y)
        .lineTo(545, y)
        .stroke();

    return y + 10;
}

/**
 * Draw table header
 */
function drawTableHeader(doc, y) {
    doc.fontSize(8).font('Helvetica-Bold');

    // Header background
    doc.rect(50, y, 495, 20).fillAndStroke('#f0f0f0', '#000');

    // Header text
    doc.fillColor('#000');
    doc.text('Sr', 55, y + 6, { width: 20 });
    doc.text('Item Details', 80, y + 6, { width: 150 });
    doc.text('Batch', 235, y + 6, { width: 50 });
    doc.text('Qty', 290, y + 6, { width: 30, align: 'right' });
    doc.text('Free', 325, y + 6, { width: 30, align: 'right' });
    doc.text('Rate', 360, y + 6, { width: 40, align: 'right' });
    doc.text('GST%', 405, y + 6, { width: 30, align: 'right' });
    doc.text('Disc%', 440, y + 6, { width: 35, align: 'right' });
    doc.text('Amount', 480, y + 6, { width: 60, align: 'right' });

    // Header bottom line
    doc.moveTo(50, y + 20).lineTo(545, y + 20).stroke();
}

/**
 * Draw table row
 */
function drawTableRow(doc, item, sr, y) {
    doc.fontSize(8).font('Helvetica');

    // Vertical lines
    doc.moveTo(50, y).lineTo(50, y + 20).stroke();
    doc.moveTo(545, y).lineTo(545, y + 20).stroke();

    // Row data
    doc.text(sr, 55, y + 5, { width: 20 });
    doc.text(item.drugName, 80, y + 5, { width: 150, ellipsis: true });
    doc.text(item.batchNumber || 'N/A', 235, y + 5, { width: 50 });
    doc.text(item.receivedQty.toString(), 290, y + 5, { width: 30, align: 'right' });
    doc.text((item.freeQty || 0).toString(), 325, y + 5, { width: 30, align: 'right' });
    doc.text(formatCurrency(item.unitPrice), 360, y + 5, { width: 40, align: 'right' });
    doc.text(item.gstPercent.toString(), 405, y + 5, { width: 30, align: 'right' });
    doc.text((item.discountPercent || 0).toString(), 440, y + 5, { width: 35, align: 'right' });
    doc.text(formatCurrency(item.lineTotal), 480, y + 5, { width: 60, align: 'right' });

    // Row bottom line
    doc.moveTo(50, y + 20).lineTo(545, y + 20).stroke();
}

/**
 * Add tax summary
 */
function addTaxSummary(doc, invoice) {
    let y = doc.y + 20;

    // Check if new page needed
    if (y > 650) {
        doc.addPage();
        y = 50;
    }

    // Group items by GST rate
    const taxGroups = {};
    invoice.items.forEach(item => {
        const rate = item.gstPercent;
        if (!taxGroups[rate]) {
            taxGroups[rate] = { subtotal: 0, tax: 0 };
        }
        const itemSubtotal = Number(item.subtotal);
        const itemTax = Number(item.taxAmount);
        taxGroups[rate].subtotal += itemSubtotal;
        taxGroups[rate].tax += itemTax;
    });

    doc.fontSize(10).font('Helvetica-Bold')
        .text('Tax Breakdown:', 50, y);

    y += 20;
    doc.fontSize(9).font('Helvetica');

    Object.keys(taxGroups).sort().forEach(rate => {
        const group = taxGroups[rate];
        const cgst = group.tax / 2;
        const sgst = group.tax / 2;

        doc.text(`GST @${rate}% on ₹${formatNumber(group.subtotal)}: `, 50, y);
        doc.text(`CGST(${rate / 2}%): ₹${formatNumber(cgst)} `, 70, y + 12);
        doc.text(`SGST(${rate / 2}%): ₹${formatNumber(sgst)} `, 70, y + 24);
        y += 45;
    });

    return y;
}

/**
 * Add payment summary
 */
function addPaymentSummary(doc, invoice) {
    let y = doc.y + 20;

    // Check if new page needed
    if (y > 680) {
        doc.addPage();
        y = 50;
    }

    const boxY = y;

    doc.fontSize(9).font('Helvetica');
    y = boxY + 10; // Initial top padding

    doc.text('Subtotal:', 360, y);
    doc.text(`₹${formatNumber(invoice.subtotal)} `, 440, y, { width: 100, align: 'right' });
    y += 15;

    doc.text('Tax Amount:', 360, y);
    doc.text(`₹${formatNumber(invoice.taxAmount)} `, 440, y, { width: 100, align: 'right' });
    y += 15;

    if (Number(invoice.adjustments) !== 0) {
        doc.text('Adjustments:', 360, y);
        doc.text(`₹${formatNumber(invoice.adjustments)} `, 440, y, { width: 100, align: 'right' });
        y += 15;
    }

    // Total line
    doc.moveTo(360, y).lineTo(535, y).stroke();
    y += 5;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Grand Total:', 360, y);
    doc.text(`₹${formatNumber(invoice.total)} `, 440, y, { width: 100, align: 'right' });
    y += 20;

    // Payment tracking
    if (Number(invoice.paidAmount) > 0) {
        doc.fontSize(9).font('Helvetica');
        doc.text('Amount Paid:', 360, y);
        doc.text(`₹${formatNumber(invoice.paidAmount)} `, 440, y, { width: 100, align: 'right', color: 'green' });
        y += 15;

        const balance = Number(invoice.total) - Number(invoice.paidAmount);
        doc.text('Balance Due:', 360, y);
        doc.text(`₹${formatNumber(balance)} `, 440, y, { width: 100, align: 'right', color: balance > 0 ? 'red' : 'green' });
    }
}

/**
 * Add tax summary and payment summary side by side  
 */
function addTaxAndPaymentSummary(doc, invoice) {
    let y = doc.y + 10;

    if (y > 600) {
        doc.addPage();
        y = 50;
    }

    const startY = y;

    // LEFT: Tax Breakdown
    const taxGroups = {};
    invoice.items.forEach(item => {
        const rate = item.gstPercent;
        if (!taxGroups[rate]) taxGroups[rate] = { subtotal: 0, tax: 0 };
        taxGroups[rate].subtotal += Number(item.subtotal);
        taxGroups[rate].tax += Number(item.taxAmount);
    });

    doc.fontSize(10).font('Helvetica-Bold').text('Tax Breakdown:', 50, y);
    y += 15;
    doc.fontSize(9).font('Helvetica');

    Object.keys(taxGroups).sort().forEach(rate => {
        const group = taxGroups[rate];
        const cgst = group.tax / 2;
        const sgst = group.tax / 2;
        doc.text(`GST @${rate}% on ₹${formatNumber(group.subtotal)}:`, 50, y);
        doc.text(`CGST(${rate / 2}%): ₹${formatNumber(cgst)}`, 70, y + 12);
        doc.text(`SGST(${rate / 2}%): ₹${formatNumber(sgst)}`, 70, y + 24);
        y += 40;
    });

    // RIGHT: Payment Summary
    let rightY = startY;
    const boxTopY = rightY;

    // Remove fixed box drawing, will draw at end
    rightY += 15; // Top padding
    doc.fontSize(9).font('Helvetica');

    doc.text('Subtotal:', 360, rightY);
    doc.text(`₹${formatNumber(invoice.subtotal)}`, 440, rightY, { width: 100, align: 'right' });
    rightY += 15;

    doc.text('Tax Amount:', 360, rightY);
    doc.text(`₹${formatNumber(invoice.taxAmount)}`, 440, rightY, { width: 100, align: 'right' });
    rightY += 15;

    if (Number(invoice.adjustments) !== 0) {
        doc.text('Adjustments:', 360, rightY);
        doc.text(`₹${formatNumber(invoice.adjustments)}`, 440, rightY, { width: 100, align: 'right' });
        rightY += 15;
    }

    doc.moveTo(360, rightY).lineTo(535, rightY).stroke();
    rightY += 5;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Grand Total:', 360, rightY);
    doc.text(`₹${formatNumber(invoice.total)}`, 440, rightY, { width: 100, align: 'right' });
    rightY += 18;

    if (Number(invoice.paidAmount) > 0) {
        doc.fontSize(9).font('Helvetica');
        doc.text('Amount Paid:', 360, rightY);
        doc.text(`₹${formatNumber(invoice.paidAmount)}`, 440, rightY, { width: 100, align: 'right' });
        rightY += 15;

        const balance = Number(invoice.total) - Number(invoice.paidAmount);
        if (balance > 0.01) {
            doc.text('Balance Due:', 360, rightY);
            doc.text(`₹${formatNumber(balance)}`, 440, rightY, { width: 100, align: 'right' });
            rightY += 15;
            rightY += 15;
        }
    }

    // Draw box around payment summary
    doc.rect(350, boxTopY, 195, rightY - boxTopY + 10).stroke();

    // Set doc.y to max of both columns for footer placement  
    doc.y = Math.max(y, rightY) + 30; // Extra margin before footer
}

/**
 * Add footer
 */
function addFooter(doc, invoice) {
    // Calculate space needed for footer (approx 100px)
    const footerHeight = 100;
    const pageHeight = doc.page.height;

    // Check if we need a new page based on current Y
    let y = doc.y + 40; // Add top margin from previous section

    // If current Y + footer height exceeds printable area, add new page
    if (y + footerHeight > pageHeight - 50) {
        doc.addPage();
        y = pageHeight - footerHeight - 50; // Place at bottom of new page
    } else {
        // Stick to bottom if there is lots of space, otherwise just flow
        // The user wants it "Always at bottom", so let's push it down
        // but ensure it doesn't overlap if content is long.
        y = Math.max(y, pageHeight - footerHeight - 50);
    }

    // Terms
    doc.fontSize(8).font('Helvetica-Bold').text('Terms & Conditions:', 50, y);
    doc.fontSize(7).font('Helvetica')
        .text('• Payment due within 30 days', 50, y + 12)
        .text('• All disputes subject to local jurisdiction', 50, y + 22);

    // Signature Area
    const signX = 400;

    // "For Store Name" text
    doc.fontSize(9).font('Helvetica')
        .text('For ' + (invoice.store?.name || 'Store Name'), signX, y, { align: 'center', width: 150 });

    // Render signature if available
    let sigY = y + 15;
    if (invoice.signatureBuffer) {
        try {
            doc.image(invoice.signatureBuffer, signX + 25, sigY, { width: 100, height: 40, fit: [100, 40], align: 'center' });
            sigY += 45;
        } catch (e) {
            console.warn('Failed to render signature');
            sigY += 30; // Fallback space
        }
    } else {
        sigY += 30;
    }

    // Line and "Authorized Signatory"
    doc.moveTo(signX, sigY).lineTo(signX + 150, sigY).stroke();
    doc.fontSize(8).text('Authorized Signatory', signX, sigY + 5, { align: 'center', width: 150 });
}





/**
 * Add watermark based on status
 */
function addWatermark(doc, invoice) {
    if (invoice.status === 'DRAFT') {
        doc.fontSize(60)
            .fillColor('#ff0000', 0.1)
            .rotate(-45, { origin: [300, 400] })
            .text('DRAFT', 150, 400)
            .rotate(45, { origin: [300, 400] })
            .fillColor('#000', 1);
    } else if (invoice.status === 'CANCELLED') {
        doc.fontSize(60)
            .fillColor('#ff0000', 0.1)
            .rotate(-45, { origin: [300, 400] })
            .text('CANCELLED', 120, 400)
            .rotate(45, { origin: [300, 400] })
            .fillColor('#000', 1);
    } else if (invoice.paymentStatus === 'UNPAID' && invoice.status === 'CONFIRMED') {
        doc.fontSize(50)
            .fillColor('#ff8800', 0.1)
            .rotate(-45, { origin: [300, 400] })
            .text('PAYMENT PENDING', 80, 400)
            .rotate(45, { origin: [300, 400] })
            .fillColor('#000', 1);
    }
}

/**
 * Format date to DD/MM/YYYY
 */
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day} /${month}/${year} `;
}

/**
 * Format currency for Indian locale
 */
function formatCurrency(amount) {
    return Number(amount).toFixed(2);
}

/**
 * Format number with Indian comma system
 */
function formatNumber(amount) {
    const num = Number(amount).toFixed(2);
    const [integer, decimal] = num.split('.');
    const lastThree = integer.substring(integer.length - 3);
    const otherNumbers = integer.substring(0, integer.length - 3);
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + (otherNumbers ? ',' : '') + lastThree;
    return decimal ? `${formatted}.${decimal} ` : formatted;
}

module.exports = {
    generateInvoicePdf
};
