/**
 * Sale Factory
 * Factory for creating Sale aggregates with different business contexts
 */

const { Sale, SaleStatus, InvoiceType } = require('./Sale');
const SaleItem = require('./SaleItem');
const { Payment } = require('./Payment');
const InvoiceNumber = require('./valueObjects/InvoiceNumber');
const Money = require('../shared/valueObjects/Money');
const { Quantity, Unit } = require('../shared/valueObjects/Quantity');

class SaleFactory {
    /**
     * Create a walk-in sale (no prescription)
     */
    static createWalkInSale(data) {
        const { storeId, customerId, patientId, items, payments, userId } = data;

        const sale = new Sale({
            storeId,
            customerId,
            patientId,
            invoiceType: InvoiceType.REGULAR,
            status: SaleStatus.DRAFT,
            createdBy: userId
        });

        // Add items
        items.forEach(itemData => {
            const item = new SaleItem({
                drugId: itemData.drugId,
                drugName: itemData.drugName,
                batchId: itemData.batchId,
                batchNumber: itemData.batchNumber,
                quantity: itemData.quantity,
                unit: itemData.unit || Unit.TABLET,
                price: itemData.price,
                discount: itemData.discount || 0,
                gstRate: itemData.gstRate || 0
            });

            item.validate();
            sale.items.push(item);
        });

        // Calculate totals
        sale.calculateTotals();

        // Add payments
        if (payments && payments.length > 0) {
            payments.forEach(paymentData => {
                const payment = new Payment(paymentData);
                payment.validate();
                sale.payments.push(payment);
            });
        }

        return sale;
    }

    /**
     * Create sale from prescription dispense
     */
    static createFromDispense(dispenseData, saleData) {
        const { dispense, userId } = dispenseData;

        const sale = new Sale({
            storeId: dispense.storeId,
            prescriptionId: dispense.prescriptionId,
            patientId: dispense.patientId,
            customerId: saleData.customerId,
            invoiceType: InvoiceType.REGULAR,
            status: SaleStatus.DRAFT,
            createdBy: userId
        });

        // Import clinical items from dispense as snapshot
        dispense.items.forEach(dispenseItem => {
            const item = new SaleItem({
                drugId: dispenseItem.drugId,
                drugName: dispenseItem.drugName,
                batchId: dispenseItem.batchId,
                batchNumber: dispenseItem.batchNumber,
                quantity: dispenseItem.quantity,
                unit: dispenseItem.unit || Unit.TABLET,
                price: dispenseItem.price,
                discount: saleData.discount || 0,
                gstRate: dispenseItem.gstRate || 0,
                // Clinical snapshot
                dosage: dispenseItem.dosage,
                frequency: dispenseItem.frequency,
                duration: dispenseItem.duration,
                instructions: dispenseItem.instructions
            });

            item.validate();
            sale.items.push(item);
        });

        sale.calculateTotals();

        // Add payments
        if (saleData.payments && saleData.payments.length > 0) {
            saleData.payments.forEach(paymentData => {
                const payment = new Payment(paymentData);
                payment.validate();
                sale.payments.push(payment);
            });
        }

        return sale;
    }

    /**
     * Create quotation/estimate (no payment required)
     */
    static createQuotation(data) {
        const { storeId, customerId, patientId, items, userId } = data;

        const sale = new Sale({
            storeId,
            customerId,
            patientId,
            invoiceType: InvoiceType.ESTIMATE,
            status: SaleStatus.DRAFT,
            createdBy: userId
        });

        // Add items
        items.forEach(itemData => {
            const item = new SaleItem({
                drugId: itemData.drugId,
                drugName: itemData.drugName,
                batchId: itemData.batchId,
                quantity: itemData.quantity,
                unit: itemData.unit || Unit.TABLET,
                price: itemData.price,
                discount: itemData.discount || 0,
                gstRate: itemData.gstRate || 0
            });

            item.validate();
            sale.items.push(item);
        });

        sale.calculateTotals();

        // No payment required for estimates
        // Add dummy payment equal to total for validation
        sale.payments.push(Payment.createCash(sale.total.getAmount()));

        return sale;
    }

    /**
     * Create credit sale (payment deferred)
     */
    static createCreditSale(data) {
        const { storeId, customerId, items, creditTerms, userId } = data;

        if (!customerId) {
            throw new Error('Credit sales require a customer');
        }

        const sale = new Sale({
            storeId,
            customerId,
            invoiceType: InvoiceType.CREDIT,
            status: SaleStatus.DRAFT,
            createdBy: userId
        });

        // Add items
        items.forEach(itemData => {
            const item = new SaleItem({
                drugId: itemData.drugId,
                drugName: itemData.drugName,
                batchId: itemData.batchId,
                quantity: itemData.quantity,
                unit: itemData.unit || Unit.TABLET,
                price: itemData.price,
                discount: itemData.discount || 0,
                gstRate: itemData.gstRate || 0
            });

            item.validate();
            sale.items.push(item);
        });

        sale.calculateTotals();

        // Add credit payment
        const creditPayment = new Payment({
            method: 'CREDIT',
            amount: sale.total.getAmount(),
            reference: creditTerms?.referenceNumber
        });

        creditPayment.validate();
        sale.payments.push(creditPayment);

        return sale;
    }

    /**
     * Create return/refund sale
     */
    static createReturn(originalSale, returnItems, reason, userId) {
        const sale = new Sale({
            storeId: originalSale.storeId,
            customerId: originalSale.customerId,
            patientId: originalSale.patientId,
            invoiceType: InvoiceType.RETURN,
            status: SaleStatus.DRAFT,
            createdBy: userId
        });

        // Add return items (negative quantities)
        returnItems.forEach(returnItem => {
            const originalItem = originalSale.items.find(i => i.id === returnItem.itemId);

            if (!originalItem) {
                throw new Error(`Item ${returnItem.itemId} not found in original sale`);
            }

            const item = new SaleItem({
                drugId: originalItem.drugId,
                drugName: originalItem.drugName,
                batchId: originalItem.batchId,
                quantity: -Math.abs(returnItem.quantity), // Negative for returns
                unit: originalItem.unit,
                price: originalItem.price,
                discount: originalItem.discount,
                gstRate: originalItem.gstRate
            });

            sale.items.push(item);
        });

        sale.calculateTotals();

        // Refund payment (negative)
        const refundPayment = new Payment({
            method: 'CASH', // Or original payment method
            amount: Math.abs(sale.total.getAmount()),
            reference: `REFUND-${originalSale.invoiceNumber}`
        });

        sale.payments.push(refundPayment);

        return sale;
    }
}

module.exports = SaleFactory;
