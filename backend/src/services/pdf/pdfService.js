const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const moment = require('moment');

class PDFService {
    constructor() {
        this.templatePath = path.join(__dirname, '../../templates/po-template.html');
    }

    /**
     * Generate Purchase Order PDF
     * @param {Object} po - Purchase Order object with supplier and items
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generatePOPdf(po) {
        try {
            // 1. Prepare Data (Canonical JSON)
            console.log('Generating PDF for PO:', po.poNumber);
            console.log('Store Data:', JSON.stringify(po.store, null, 2));
            const data = this.mapPOToTemplateData(po);
            console.log('Mapped Template Data:', JSON.stringify(data.company, null, 2));

            // 2. Read Template
            const templateHtml = fs.readFileSync(this.templatePath, 'utf8');

            // 3. Compile Template
            const template = handlebars.compile(templateHtml);
            const html = template(data);

            // 4. Generate PDF with Puppeteer
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Set content
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px'
                }
            });

            await browser.close();

            return pdfBuffer;
        } catch (error) {
            console.error('PDF Generation Error:', error);
            throw error;
        }
    }

    mapPOToTemplateData(po) {
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

        // Calculate totals and tax splits
        let taxableSubTotal = 0;
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        const items = po.items.map((item, index) => {
            const qty = item.quantity;
            const rate = Number(item.unitPrice);
            const discount = item.discountPercent || 0;

            // Taxable value per item (after discount)
            const taxableValue = qty * rate * (1 - discount / 100);

            // Tax calculation
            const gstRate = Number(item.gstPercent) || 0;
            const taxAmount = taxableValue * (gstRate / 100);

            // Split tax (Assuming intra-state for now, so CGST + SGST)
            // TODO: Add logic for inter-state (IGST) based on state comparison
            const isInterState = false; // Placeholder

            let cgst = 0, sgst = 0, igst = 0;
            if (isInterState) {
                igst = taxAmount;
            } else {
                cgst = taxAmount / 2;
                sgst = taxAmount / 2;
            }

            taxableSubTotal += taxableValue;
            cgstTotal += cgst;
            sgstTotal += sgst;
            igstTotal += igst;

            return {
                sr_no: index + 1,
                description: item.drug?.name || 'Item',
                hsn: item.drug?.hsnCode || '-',
                qty: qty,
                uom: item.drug?.defaultUnit || 'Unit',
                rate: formatCurrency(rate),
                taxable_value: formatCurrency(taxableValue),
                tax: {
                    cgst: formatCurrency(cgst),
                    sgst: formatCurrency(sgst),
                    igst: formatCurrency(igst)
                },
                discount: discount
            };
        });

        const totalTax = cgstTotal + sgstTotal + igstTotal;
        const grandTotal = taxableSubTotal + totalTax;

        return {
            invoice_id: po.poNumber,
            invoice_date: formatDate(po.orderDate),
            supply_date: formatDate(po.expectedDeliveryDate || po.orderDate),
            place_of_supply: po.store?.state || '',
            financial_year: '2025-26', // TODO: Calculate dynamic FY
            irn: null, // Placeholder
            status: po.status,

            company: {
                legal_name: po.store?.displayName || po.store?.name || 'HopeRx Pharmaceuticals',
                trade_name: po.store?.name || 'HopeRx',
                address: `${po.store?.addressLine1 || ''}, ${po.store?.city || ''}`,
                city: po.store?.city || '',
                state: po.store?.state || '',
                pincode: po.store?.pinCode || '',
                gstin: po.store?.licenses?.find(l => l.type === 'GSTIN')?.number || 'N/A',
                phone: po.store?.phoneNumber || '',
                email: po.store?.email || '',
                logo_url: po.store?.logoUrl || '', // Ensure this is a valid URL or base64
                bank: {
                    account_name: po.store?.displayName || 'HopeRx',
                    account_no: 'XXXXXXXXXXXX', // Placeholder
                    ifsc: 'XXXX0000000' // Placeholder
                }
            },

            customer: { // In PO context, the "Customer" is the Supplier (Vendor) we are buying from? 
                // WAIT: A Purchase Order is sent TO a Supplier. 
                // So "Bill To" in a PO is usually US (The Store).
                // But the user's template says "Bill To: {{customer.name}}".
                // In an Invoice, "Bill To" is the Buyer.
                // In a PO, we are the Buyer.
                // So "Bill To" should be the Store.
                // And "Vendor" is the Supplier.
                // Let's map "customer" to the Supplier for now as per the user's JSON example?
                // User JSON: "customer": { "name": "ABC Pharmacy" ... } -> This looks like the BUYER.
                // User JSON: "company": { "legal_name": "HopeRx" ... } -> This looks like the ISSUER.
                // If this is a PO generated by HopeRx sent to a Supplier:
                // Issuer = HopeRx. Recipient = Supplier.
                // BUT usually a PO says "Vendor: [Supplier]" and "Ship To: [Us]".
                // The user's template has "Bill To" and "Ship To".
                // This template looks like a SALES INVOICE template.
                // For a PO, we need to adapt it.
                // Let's map "customer" to the Supplier so it shows up in the "Bill To" slot?
                // No, "Bill To" in a PO is US.
                // Let's map "customer" to the Store (Us).

                name: po.supplier.name,
                billing_address: `${po.supplier.addressLine1}, ${po.supplier.city}`,
                shipping_address: `${po.store?.addressLine1}, ${po.store?.city}`, // Ship to Store
                gstin: po.supplier.gstin || 'N/A',
                contact: po.supplier.phoneNumber
            },

            items: items,

            totals: {
                taxable_sub_total: formatCurrency(taxableSubTotal),
                cgst_total: formatCurrency(cgstTotal),
                sgst_total: formatCurrency(sgstTotal),
                igst_total: formatCurrency(igstTotal),
                total_tax: formatCurrency(totalTax),
                round_off: formatCurrency(0), // TODO
                grand_total: formatCurrency(grandTotal),
                amount_in_words: this.convertNumberToWords(grandTotal)
            },

            payment_terms: {
                due_date: formatDate(moment(po.orderDate).add(30, 'days')),
                terms_text: po.paymentTerms || 'Payment due within 30 days',
                upi_vpa: 'hoperx@hdfcbank', // Placeholder
                upi_qr_url: '' // Placeholder
            }
        };
    }

    /**
     * Generate Sales Invoice PDF
     * @param {Object} sale - Sale object with items, patient, and payment details
     * @returns {Promise<Buffer>} - PDF buffer
     */
    async generateSaleInvoicePdf(sale) {
        try {
            console.log('Generating Invoice PDF for:', sale.invoiceNumber);

            // Prepare data for template
            const data = this.mapSaleToTemplateData(sale);

            // Read invoice template
            const templatePath = path.join(__dirname, '../../templates/sale-invoice-template.html');
            const templateHtml = fs.readFileSync(templatePath, 'utf8');

            // Compile template
            const template = handlebars.compile(templateHtml);
            const html = template(data);

            // Generate PDF
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            await page.setContent(html, { waitUntil: 'networkidle0' });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px'
                }
            });

            await browser.close();

            return pdfBuffer;
        } catch (error) {
            console.error('Invoice PDF Generation Error:', error);
            throw error;
        }
    }

    /**
     * Map Sale data to invoice template format
     */
    mapSaleToTemplateData(sale) {
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount || 0);
        };

        const formatDate = (date) => {
            return date ? moment(date).format('DD-MMM-YYYY') : '';
        };

        const formatTime = (date) => {
            return date ? moment(date).format('hh:mm A') : '';
        };

        // Calculate tax breakdown
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;

        // Map items
        const items = sale.items.map((item, index) => {
            const gstRate = Number(item.gstRate) || 0;
            const lineTotal = Number(item.lineTotal) || 0;
            const discount = Number(item.discount) || 0;

            // Calculate tax amount for this item
            const taxableAmount = lineTotal / (1 + gstRate / 100);
            const taxAmount = lineTotal - taxableAmount;

            // Split tax (CGST + SGST for intra-state)
            // TODO: Add inter-state logic based on store and customer state
            const cgst = taxAmount / 2;
            const sgst = taxAmount / 2;

            cgstTotal += cgst;
            sgstTotal += sgst;

            return {
                srNo: index + 1,
                drugName: item.drug?.name || 'Item',
                hsnCode: item.drug?.hsnCode || '-',
                batchNumber: item.batch?.batchNumber || '',
                expiryDate: item.batch?.expiryDate ? formatDate(item.batch.expiryDate) : '',
                quantity: item.quantity,
                mrp: formatCurrency(item.mrp),
                discount: discount > 0 ? formatCurrency(discount) : null,
                gstRate: gstRate.toFixed(2),
                lineTotal: formatCurrency(lineTotal)
            };
        });

        // Invoice type label
        const invoiceTypeLabels = {
            RECEIPT: 'RECEIPT',
            GST_INVOICE: 'TAX INVOICE',
            CREDIT_NOTE: 'CREDIT NOTE'
        };

        return {
            invoiceNumber: sale.invoiceNumber,
            invoiceTypeLabel: invoiceTypeLabels[sale.invoiceType] || 'INVOICE',
            invoiceDate: formatDate(sale.createdAt),
            invoiceTime: formatTime(sale.createdAt),

            store: {
                displayName: sale.store?.displayName || sale.store?.name || 'HopeRx Pharmacy',
                addressLine1: sale.store?.addressLine1 || '',
                addressLine2: sale.store?.addressLine2 || '',
                city: sale.store?.city || '',
                state: sale.store?.state || '',
                pinCode: sale.store?.pinCode || '',
                gstin: sale.store?.gstin || '',
                dlNumber: sale.store?.dlNumber || '',
                phoneNumber: sale.store?.phoneNumber || '',
                email: sale.store?.email || '',
                logoUrl: sale.store?.logoUrl || '',
                is24x7: sale.store?.is24x7 || false
            },

            patient: sale.patient ? {
                firstName: sale.patient.firstName,
                lastName: sale.patient.lastName,
                phoneNumber: sale.patient.phoneNumber,
                email: sale.patient.email,
                addressLine1: sale.patient.addressLine1,
                addressLine2: sale.patient.addressLine2,
                city: sale.patient.city,
                state: sale.patient.state,
                pinCode: sale.patient.pinCode,
                dateOfBirth: sale.patient.dateOfBirth ? formatDate(sale.patient.dateOfBirth) : null,
                gender: sale.patient.gender,
                bloodGroup: sale.patient.bloodGroup
            } : null,

            items: items,

            paymentSplits: sale.paymentSplits?.map(split => ({
                paymentMethod: split.paymentMethod,
                amount: formatCurrency(split.amount),
                upiTransactionId: split.upiTransactionId,
                cardLast4: split.cardLast4
            })) || [],

            soldByName: sale.soldByUser?.firstName + ' ' + sale.soldByUser?.lastName || 'Staff',

            subtotal: formatCurrency(sale.subtotal),
            discountAmount: Number(sale.discountAmount) > 0 ? formatCurrency(sale.discountAmount) : null,
            taxAmount: formatCurrency(sale.taxAmount),
            cgst: cgstTotal > 0 ? formatCurrency(cgstTotal) : null,
            sgst: sgstTotal > 0 ? formatCurrency(sgstTotal) : null,
            igst: igstTotal > 0 ? formatCurrency(igstTotal) : null,
            roundOff: Number(sale.roundOff) !== 0 ? formatCurrency(sale.roundOff) : null,
            total: formatCurrency(sale.total),
            amountInWords: this.convertNumberToWords(Number(sale.total)),

            upiQrCode: null // TODO: Generate QR code for UPI payments
        };
    }

    convertNumberToWords(amount) {
        // Simple placeholder for now, can use a library like 'number-to-words' if needed
        return `${amount} Rupees Only`;
    }
}

module.exports = new PDFService();
