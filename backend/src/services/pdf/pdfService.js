const PDFDocument = require('pdfkit');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

class PDFService {
    constructor() {
        this.fonts = {
            regular: 'Helvetica',
            bold: 'Helvetica-Bold'
        };
    }

    /**
     * Generate Purchase Order PDF
     * @param {Object} po - Purchase Order object with supplier and items
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generatePOPdf(po) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Header
                this.generateHeader(doc, po);

                // Supplier & Store Info
                this.generateInfo(doc, po);

                // Items Table
                this.generateTable(doc, po);

                // Footer
                this.generateFooter(doc, po);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    generateHeader(doc, po) {
        doc
            .fontSize(20)
            .text('PURCHASE ORDER', 50, 50, { align: 'right' })
            .fontSize(10)
            .text(`PO Number: ${po.poNumber}`, { align: 'right' })
            .text(`Date: ${moment(po.orderDate).format('DD MMM YYYY')}`, { align: 'right' })
            .text(`Status: ${po.status}`, { align: 'right' })
            .moveDown();

        // Add logo if available (placeholder)
        // doc.image('path/to/logo.png', 50, 45, { width: 50 })

        doc.moveDown();
        doc.lineWidth(1).moveTo(50, 130).lineTo(550, 130).stroke();
    }

    generateInfo(doc, po) {
        const customerTop = 150;

        doc
            .fontSize(10)
            .font(this.fonts.bold)
            .text('FROM:', 50, customerTop)
            .font(this.fonts.regular)
            .text(po.store.displayName)
            .text(po.store.addressLine1)
            .text(`${po.store.city}, ${po.store.state} - ${po.store.pinCode}`)
            .text(`Phone: ${po.store.phoneNumber}`)
            .text(`Email: ${po.store.email}`)
            .moveDown();

        doc
            .font(this.fonts.bold)
            .text('TO:', 300, customerTop)
            .font(this.fonts.regular)
            .text(po.supplier.name)
            .text(po.supplier.addressLine1)
            .text(`${po.supplier.city}, ${po.supplier.state} - ${po.supplier.pinCode}`)
            .text(`Contact: ${po.supplier.contactName}`)
            .text(`Phone: ${po.supplier.phoneNumber}`)
            .moveDown();

        doc.moveDown();
    }

    generateTable(doc, po) {
        let i;
        const invoiceTableTop = 300;
        const fontBold = this.fonts.bold;
        const fontRegular = this.fonts.regular;

        doc.font(fontBold);
        this.generateTableRow(
            doc,
            invoiceTableTop,
            'Item',
            'Unit Price',
            'Quantity',
            'Total'
        );
        doc.font(fontRegular);
        this.generateHr(doc, invoiceTableTop + 20);

        let position = invoiceTableTop + 30;

        // Items
        po.poItems.forEach((item, index) => {
            // Check for page break
            if (position > 700) {
                doc.addPage();
                position = 50;
            }

            const itemName = item.drug.name + (item.drug.strength ? ` ${item.drug.strength}` : '');

            this.generateTableRow(
                doc,
                position,
                itemName,
                `₹${parseFloat(item.unitPrice).toFixed(2)}`,
                item.quantityOrdered,
                `₹${(item.quantityOrdered * parseFloat(item.unitPrice)).toFixed(2)}`
            );

            this.generateHr(doc, position + 20);
            position += 30;
        });

        const subtotalPosition = position + 20;

        doc.font(fontBold);
        this.generateTableRow(
            doc,
            subtotalPosition,
            '',
            '',
            'Subtotal',
            `₹${parseFloat(po.subtotal).toFixed(2)}`
        );

        this.generateTableRow(
            doc,
            subtotalPosition + 20,
            '',
            '',
            'Tax',
            `₹${parseFloat(po.taxAmount).toFixed(2)}`
        );

        this.generateTableRow(
            doc,
            subtotalPosition + 40,
            '',
            '',
            'Grand Total',
            `₹${(parseFloat(po.subtotal) + parseFloat(po.taxAmount)).toFixed(2)}`
        );

        doc.font(fontRegular);
    }

    generateFooter(doc, po) {
        doc
            .fontSize(10)
            .text(
                'Payment is due within 30 days. Thank you for your business.',
                50,
                700,
                { align: 'center', width: 500 }
            );
    }

    generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
        doc
            .fontSize(10)
            .text(item, 50, y, { width: 280 })
            .text(unitCost, 340, y, { width: 90, align: 'right' })
            .text(quantity, 440, y, { width: 50, align: 'right' })
            .text(lineTotal, 500, y, { align: 'right' });
    }

    generateHr(doc, y) {
        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }
}

module.exports = new PDFService();
