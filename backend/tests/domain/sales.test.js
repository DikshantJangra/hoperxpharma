/**
 * Domain Tests - Sales Entities
 */

const { Sale, SaleStatus, InvoiceType } = require('../../src/domain/sales/Sale');
const SaleItem = require('../../src/domain/sales/SaleItem');
const { Payment, PaymentMethod } = require('../../src/domain/sales/Payment');
const InvoiceNumber = require('../../src/domain/sales/valueObjects/InvoiceNumber');
const Money = require('../../src/domain/shared/valueObjects/Money');
const { Quantity, Unit } = require('../../src/domain/shared/valueObjects/Quantity');

describe('Sale Aggregate', () => {
    test('should create quick sale', () => {
        const sale = Sale.createQuickSale({
            storeId: 'store1',
            userId: 'user1',
            items: [
                {
                    drugId: 'drug1',
                    drugName: 'Paracetamol',
                    batchId: 'batch1',
                    quantity: 10,
                    price: 5,
                    gstRate: 12
                }
            ],
            payments: [
                { method: PaymentMethod.CASH, amount: 56 }
            ]
        });

        expect(sale.status).toBe(SaleStatus.DRAFT);
        expect(sale.items.length).toBe(1);
        expect(sale.payments.length).toBe(1);
    });

    test('should calculate totals correctly', () => {
        const sale = new Sale({ storeId: 'store1' });

        sale.addItem({
            drugId: 'drug1',
            drugName: 'Drug A',
            batchId: 'batch1',
            quantity: 10,
            price: 10, // 100 total
            discount: 10, // 10 discount = 90
            gstRate: 18 // 16.2 tax
        });

        sale.calculateTotals();

        expect(sale.subtotal.getAmount()).toBe(100);
        expect(sale.discount.getAmount()).toBe(10);
        expect(sale.tax.getAmount()).toBeCloseTo(16.2, 1);
        // Total should be rounded
    });

    test('should validate payment matches total', () => {
        const sale = new Sale({ storeId: 'store1' });

        sale.addItem({
            drugId: 'drug1',
            drugName: 'Test',
            batchId: 'batch1',
            quantity: 1,
            price: 100,
            gstRate: 0
        });

        sale.calculateTotals();

        // Incorrect payment amount
        sale.addPayment({ method: PaymentMethod.CASH, amount: 50 });

        expect(() => sale.validate()).toThrow('Payment mismatch');
    });

    test('should complete sale successfully', () => {
        const sale = new Sale({ storeId: 'store1' });

        sale.addItem({
            drugId: 'drug1',
            drugName: 'Test',
            batchId: 'batch1',
            quantity: 1,
            price: 100,
            gstRate: 0
        });

        sale.calculateTotals();
        sale.addPayment({ method: PaymentMethod.CASH, amount: sale.total.getAmount() });

        sale.complete(new InvoiceNumber('INV-202601-0001'));

        expect(sale.status).toBe(SaleStatus.COMPLETED);
        expect(sale.invoiceNumber).toBeDefined();
    });

    test('should handle estimate/quotation', () => {
        const sale = new Sale({
            storeId: 'store1',
            invoiceType: InvoiceType.ESTIMATE
        });

        sale.addItem({
            drugId: 'drug1',
            drugName: 'Test',
            batchId: 'batch1',
            quantity: 1,
            price: 100,
            gstRate: 0
        });

        sale.calculateTotals();
        sale.addPayment({ method: PaymentMethod.CASH, amount: sale.total.getAmount() });

        sale.complete();

        expect(sale.status).toBe(SaleStatus.QUOTATION);
    });

    test('should prevent cancelling completed sale', () => {
        const sale = new Sale({ storeId: 'store1', status: SaleStatus.COMPLETED });

        expect(() => sale.cancel('Test reason')).toThrow('Cannot cancel completed sale');
    });
});

describe('SaleItem Entity', () => {
    test('should calculate line amounts correctly', () => {
        const item = new SaleItem({
            drugId: 'drug1',
            drugName: 'Test Drug',
            batchId: 'batch1',
            quantity: 10,
            price: 10,
            discount: 10,
            gstRate: 18
        });

        expect(item.getGrossAmount().getAmount()).toBe(100);
        expect(item.getDiscountAmount().getAmount()).toBe(10);
        expect(item.getTaxableAmount().getAmount()).toBe(90);
        expect(item.getTaxAmount().getAmount()).toBeCloseTo(16.2, 1);
        expect(item.getLineTotal().getAmount()).toBeCloseTo(106.2, 1);
    });

    test('should identify prescription items', () => {
        const regularItem = new SaleItem({
            drugId: 'drug1',
            drugName: 'OTC Drug',
            quantity: 1,
            price: 10
        });

        const prescriptionItem = new SaleItem({
            drugId: 'drug2',
            drugName: 'Rx Drug',
            quantity: 1,
            price: 10,
            dosage: '500mg',
            frequency: 'BID',
            duration: '7 days'
        });

        expect(regularItem.isPrescriptionItem()).toBe(false);
        expect(prescriptionItem.isPrescriptionItem()).toBe(true);
    });

    test('should validate item data', () => {
        const invalidItem = new SaleItem({
            drugId: 'drug1',
            drugName: 'Test',
            quantity: -5, // Invalid
            price: 10
        });

        expect(() => invalidItem.validate()).toThrow('quantity must be positive');
    });
});

describe('Payment Value Object', () => {
    test('should create cash payment', () => {
        const payment = Payment.createCash(100);

        expect(payment.method).toBe(PaymentMethod.CASH);
        expect(payment.amount.getAmount()).toBe(100);
    });

    test('should create card payment', () => {
        const payment = Payment.createCard(250, 'TXN123456', '1234');

        expect(payment.method).toBe(PaymentMethod.CARD);
        expect(payment.cardLastFour).toBe('1234');
        expect(payment.reference).toBe('TXN123456');
    });

    test('should identify digital payments', () => {
        const cash = Payment.createCash(100);
        const card = Payment.createCard(100, 'TXN123', '1234');
        const upi = Payment.createUPI(100, 'UPI123', 'user@bank');

        expect(cash.isDigital()).toBe(false);
        expect(card.isDigital()).toBe(true);
        expect(upi.isDigital()).toBe(true);
    });

    test('should validate digital payments require reference', () => {
        const invalidCard = new Payment({
            method: PaymentMethod.CARD,
            amount: 100
            // Missing reference
        });

        expect(() => invalidCard.validate()).toThrow('requires transaction reference');
    });
});

describe('InvoiceNumber Value Object', () => {
    test('should validate invoice number format', () => {
        expect(() => new InvoiceNumber('INV-202601-0001')).not.toThrow();
        expect(() => new InvoiceNumber('INVALID')).toThrow('Invalid invoice number format');
    });

    test('should generate invoice number', () => {
        const invoice = InvoiceNumber.generate('INV', 42);
        const parsed = invoice.parse();

        expect(parsed.prefix).toBe('INV');
        expect(parsed.sequence).toBe(42);
    });
});
