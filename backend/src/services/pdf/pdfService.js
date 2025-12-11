const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const moment = require('moment');
const UPIQRCode = require('upiqrcode').default; // Module exports as { default: Function }

class PDFService {
    constructor() {
        this.templatePath = path.join(__dirname, '../../templates/po-template.html');
    }

    /**
     * Get Puppeteer launch options based on environment
     * Handles Chrome executable path detection for production (Render) deployment
     * @returns {Object} - Puppeteer launch options
     */
    getPuppeteerLaunchOptions() {
        const options = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        };

        // In production (Render), explicitly set the executable path
        if (process.env.NODE_ENV === 'production') {
            try {
                // Try to use Puppeteer's built-in executable path first
                options.executablePath = puppeteer.executablePath();
            } catch (error) {
                console.warn('Puppeteer executablePath() failed, using fallback:', error.message);
                // Fallback: Common Chrome locations on Linux (Render uses Linux)
                const possiblePaths = [
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/google-chrome',
                    '/usr/bin/chromium-browser',
                    '/usr/bin/chromium'
                ];

                const fs = require('fs');
                for (const chromePath of possiblePaths) {
                    if (fs.existsSync(chromePath)) {
                        options.executablePath = chromePath;
                        console.log('Using Chrome at:', chromePath);
                        break;
                    }
                }
            }
        }

        console.log('Puppeteer launch options:', JSON.stringify(options, null, 2));
        return options;
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
            const browser = await puppeteer.launch(this.getPuppeteerLaunchOptions());
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
            const data = await this.mapSaleToTemplateData(sale);

            // Read invoice template
            const templatePath = path.join(__dirname, '../../templates/sale-invoice-template.html');
            const templateHtml = fs.readFileSync(templatePath, 'utf8');

            // Compile template
            const template = handlebars.compile(templateHtml);
            const html = template(data);

            // Generate PDF
            const browser = await puppeteer.launch(this.getPuppeteerLaunchOptions());
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
    async mapSaleToTemplateData(sale) {
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

        // Calculate tax breakdown
        let cgstTotal = 0;
        let sgstTotal = 0;
        let igstTotal = 0;
        let totalMrp = 0;
        let totalSaving = 0;

        // Map items
        const items = sale.items.map((item, index) => {
            const gstRate = Number(item.gstRate) || 0;
            const lineTotal = Number(item.lineTotal) || 0;
            const discount = Number(item.discount) || 0;
            const mrp = Number(item.mrp) || 0;
            const quantity = Number(item.quantity) || 0;
            // const unitPrice = Number(item.price) || 0; // This is the selling price per unit

            // Calculate tax amount for this item
            const taxableAmount = lineTotal / (1 + gstRate / 100);
            const taxAmount = lineTotal - taxableAmount;

            // Split tax (CGST + SGST for intra-state)
            // TODO: Add inter-state logic based on store and customer state
            const cgst = taxAmount / 2;
            const sgst = taxAmount / 2;

            cgstTotal += cgst;
            sgstTotal += sgst;

            const itemTotalMrp = mrp * quantity;
            totalMrp += itemTotalMrp;

            // Discounted Price (D.Price) is the effective unit price after discount
            // If item.price is already the discounted price, use it.
            // If item.price is base price and discount is separate, we need to calculate.
            // Assuming item.price IS the final selling price per unit.
            // const dPrice = unitPrice;

            return {
                srNo: index + 1,
                drugName: item.drug?.name || 'Item',
                manufacturer: item.drug?.manufacturer || '',
                packSize: item.drug?.packSize || '1s',
                hsnCode: item.drug?.hsnCode || '3004', // Default HSN if missing
                batchNumber: item.batch?.batchNumber || '',
                expiryDate: item.batch?.expiryDate ? moment(item.batch.expiryDate).format('MM/YY') : '',
                quantity: quantity,
                mrp: formatCurrency(mrp),
                prevMrp: null, // Placeholder as per plan
                // dPrice: formatCurrency(dPrice),
                gstPercent: gstRate + '%',
                lineTotal: formatCurrency(lineTotal)
            };
        });

        // Calculate Global Totals
        // Total Saving = Total MRP - Grand Total
        // Note: Grand Total might include Round Off, so we should use sale.total
        totalSaving = totalMrp - Number(sale.total);
        if (totalSaving < 0) totalSaving = 0; // Should not happen usually

        // Extract Licenses
        // Assuming store.licenses is an array of objects { type: 'DL'|'GSTIN'|'FSSAI', number: '...' }
        // For now, mapping from specific fields or mocking if structure differs
        // As per previous code, we had store.gstin, store.dlNumber.
        // We will try to format them nicely.

        const licenses = [];
        if (sale.store?.dlNumber) {
            // Check if there are multiple DLs separated by comma
            const dls = sale.store.dlNumber.split(',');
            dls.forEach((dl, idx) => {
                licenses.push({ name: dls.length > 1 ? `LICENSE 2${idx}` : 'LICENSE 20/21', number: dl.trim() });
            });
        }
        // Add specific licenses if available in a 'licenses' array (if schema supports it)
        // Check `sale.store.licenses` if it exists.

        let fssai = sale.store?.fssai || ''; // If schema has it
        let pan = sale.store?.pan || '';     // If schema has it

        return {
            invoiceNumber: sale.invoiceNumber,
            invoiceDate: formatDate(sale.createdAt),
            invoiceTime: formatTime(sale.createdAt),

            store: {
                displayName: sale.store?.displayName || sale.store?.name || 'Store Name',
                subtitle: '', // Removed dummy subtitle
                addressLine1: sale.store?.addressLine1 || '',
                city: sale.store?.city || '',
                state: sale.store?.state || '',
                pinCode: sale.store?.pinCode || '',
                phone: sale.store?.phoneNumber || '',
                licenses: licenses,
                fssai: fssai,
                gstin: sale.store?.gstin || '',
                pan: pan,
                logoUrl: sale.store?.logoUrl || '',
                terms: sale.store?.termsAndConditions
                    ? sale.store.termsAndConditions.split('\n')
                    : [
                        'Goods once sold will not be taken back.',
                        'Prescription drugs are sold against valid prescription only.'
                    ],
                jurisdiction: sale.store?.jurisdiction || ''
            },

            patient: {
                name: sale.patient ? `${sale.patient.firstName} ${sale.patient.lastName}`.trim() : 'Walk-in Customer',
                gender: sale.patient?.gender ? sale.patient.gender[0].toUpperCase() : '', // M/F
                phone: sale.patient?.phoneNumber || '',
                refBy: sale.doctorName || 'Dr. Pravesh' // Default or actual
            },

            items: items,
            totalItems: items.length,

            totals: {
                subtotal: formatCurrency(sale.subtotal),
                discountAmount: Number(sale.discountAmount) > 0 ? formatCurrency(sale.discountAmount) : null,
                taxAmount: formatCurrency(sale.taxAmount),
                cgst: formatCurrency(cgstTotal),
                sgst: formatCurrency(sgstTotal),
                totalMrp: formatCurrency(totalMrp),
                totalSaving: formatCurrency(totalSaving),
                roundOff: Math.abs(Number(sale.roundOff)).toFixed(2),
                grandTotal: formatCurrency(sale.total)
            },

            billedBy: await this.getSoldByUserName(sale.soldBy), // Fetch user name from soldBy ID
            soldBySignature: sale.store?.signatureUrl || '', // Store signature for authorized signatory
            footerText: sale.store?.settings?.footerText || '', // Custom footer text from invoice design

            generatedAt: moment().format('DD-MM-YY hh:mm A'),

            // For QR Code (can be an image URL or text to generate)
            qrCodeUrl: await this.generateUPIQRCode(sale.store, sale.total)
        };
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

            // Generate QR code - upiqrcode is a function that returns {qr, intent}
            const result = await UPIQRCode({
                payeeVPA: upiId,
                payeeName: store.displayName || store.name,
                amount: amount.toString(),
                transactionNote: 'Invoice Payment',
            });

            console.log('QR Code generated');
            console.log('Result keys:', Object.keys(result));

            // result.qr contains the base64 PNG data URL
            const qrDataUrl = result.qr;

            console.log('✓ QR Code generated successfully');
            console.log('QR Data URL length:', qrDataUrl?.length || 0);
            console.log('QR Data URL preview:', qrDataUrl?.substring(0, 100));

            return qrDataUrl;
        } catch (error) {
            console.error('❌ QR Code Generation Error:', error);
            console.error('Error stack:', error.stack);
            return ''; // Return empty string on error, don't crash PDF generation
        }
    }

    convertNumberToWords(amount) {
        // Simple placeholder for now, can use a library like 'number-to-words' if needed
        const num = parseInt(amount, 10);
        if (isNaN(num)) return '';

        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            const n_array = ('000000000' + n).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_array) return;
            let str = '';
            str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
            str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
            str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
            str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
            str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
            return str;
        }

        return inWords(num) + 'Rupees Only';
    }
}

module.exports = new PDFService();
