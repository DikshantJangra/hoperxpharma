/**
 * Sale Aggregate Root
 * Core domain entity for sales transactions
 * Encapsulates all business rules related to sales
 */

const InvoiceNumber = require('./valueObjects/InvoiceNumber');
const Money = require('../shared/valueObjects/Money');
const { PaymentMismatchError } = require('../shared/errors/DomainErrors');

const SaleStatus = {
    DRAFT: 'DRAFT',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    REFUNDED: 'REFUNDED',
    QUOTATION: 'QUOTATION'
};

const InvoiceType = {
    REGULAR: 'REGULAR',
    ESTIMATE: 'ESTIMATE',
    CREDIT: 'CREDIT',
    RETURN: 'RETURN'
};

class Sale {
    constructor(data) {
        this.id = data.id;

        this.invoiceNumber = data.invoiceNumber instanceof InvoiceNumber
            ? data.invoiceNumber
            : data.invoiceNumber ? new InvoiceNumber(data.invoiceNumber) : null;

        this.status = data.status || SaleStatus.DRAFT;
        this.invoiceType = data.invoiceType || InvoiceType.REGULAR;

        this.storeId = data.storeId;
        this.customerId = data.customerId;
        this.patientId = data.patientId;
        this.prescriptionId = data.prescriptionId;

        this.items = data.items || [];
        this.payments = data.payments || [];

        // Financial totals
        this.subtotal = data.subtotal instanceof Money ? data.subtotal : new Money(data.subtotal || 0);
        this.discount = data.discount instanceof Money ? data.discount : new Money(data.discount || 0);
        this.tax = data.tax instanceof Money ? data.tax : new Money(data.tax || 0);
        this.total = data.total instanceof Money ? data.total : new Money(data.total || 0);
        this.roundingAdjustment = data.roundingAdjustment || 0;

        this.createdAt = data.createdAt || new Date();
        this.createdBy = data.createdBy;

        // Domain events
        this.domainEvents = [];
    }

    /**
     * Factory: Create a quick sale (walk-in, no prescription)
     */
    static createQuickSale(data) {
        const sale = new Sale({
            storeId: data.storeId,
            customerId: data.customerId,
            patientId: data.patientId,
            invoiceType: data.invoiceType || InvoiceType.REGULAR,
            createdBy: data.userId
        });

        // Add items
        if (data.items && data.items.length > 0) {
            data.items.forEach(itemData => {
                sale.addItem(itemData);
            });
        }

        // Calculate totals
        sale.calculateTotals();

        // Add payments
        if (data.payments && data.payments.length > 0) {
            data.payments.forEach(paymentData => {
                sale.addPayment(paymentData);
            });
        }

        return sale;
    }

    /**
     * Factory: Create sale from prescription dispense
     */
    static createFromDispense(dispense, saleData) {
        const sale = new Sale({
            storeId: dispense.storeId,
            prescriptionId: dispense.prescriptionId,
            patientId: dispense.patientId,
            invoiceType: InvoiceType.REGULAR,
            createdBy: saleData.userId
        });

        // Import clinical data from dispense as snapshot
        dispense.items.forEach(dispenseItem => {
            sale.addItem({
                drugId: dispenseItem.drugId,
                drugName: dispenseItem.drugName,
                batchId: dispenseItem.batchId,
                quantity: dispenseItem.quantity,
                price: dispenseItem.price,
                discount: dispenseItem.discount || 0,
                // Clinical snapshot
                dosage: dispenseItem.dosage,
                frequency: dispenseItem.frequency,
                duration: dispenseItem.duration,
                instructions: dispenseItem.instructions
            });
        });

        sale.calculateTotals();

        return sale;
    }

    // ========== Business Logic Methods ==========

    /**
     * Add item to sale
     */
    addItem(itemData) {
        if (this.status !== SaleStatus.DRAFT) {
            throw new Error('Cannot add items to non-draft sale');
        }

        this.items.push({
            id: itemData.id,
            drugId: itemData.drugId,
            drugName: itemData.drugName,
            batchId: itemData.batchId,
            quantity: itemData.quantity,
            price: new Money(itemData.price),
            discount: itemData.discount || 0,
            gstRate: itemData.gstRate || 0,
            // Clinical data (optional, from prescription)
            dosage: itemData.dosage,
            frequency: itemData.frequency,
            duration: itemData.duration,
            instructions: itemData.instructions
        });
    }

    /**
     * Add payment to sale
     */
    addPayment(paymentData) {
        this.payments.push({
            method: paymentData.method,
            amount: new Money(paymentData.amount),
            reference: paymentData.reference
        });
    }

    /**
     * Calculate sale totals
     */
    calculateTotals() {
        let subtotal = Money.zero();
        let totalDiscount = Money.zero();
        let totalTax = Money.zero();

        this.items.forEach(item => {
            const itemTotal = item.price.multiply(item.quantity);
            const itemDiscount = itemTotal.applyPercentage(item.discount);
            const taxableAmount = itemTotal.subtract(itemDiscount);
            const itemTax = taxableAmount.applyPercentage(item.gstRate);

            subtotal = subtotal.add(itemTotal);
            totalDiscount = totalDiscount.add(itemDiscount);
            totalTax = totalTax.add(itemTax);
        });

        this.subtotal = subtotal;
        this.discount = totalDiscount;
        this.tax = totalTax;

        // Calculate grand total
        let grandTotal = subtotal.subtract(totalDiscount).add(totalTax);

        // Apply rounding
        const roundedAmount = Math.round(grandTotal.getAmount());
        this.roundingAdjustment = roundedAmount - grandTotal.getAmount();
        this.total = new Money(roundedAmount);
    }

    /**
     * Validate sale before completion
     */
    validate() {
        // Validate has items
        if (this.items.length === 0) {
            throw new Error('Sale must have at least one item');
        }

        // Validate payment matches total
        const totalPayments = this.payments.reduce(
            (sum, payment) => sum.add(payment.amount),
            Money.zero()
        );

        if (!totalPayments.equals(this.total)) {
            throw new PaymentMismatchError(this.total, totalPayments);
        }

        // Validate invoice type specific rules
        if (this.invoiceType === InvoiceType.CREDIT) {
            if (!this.customerId) {
                throw new Error('Credit sales require a customer');
            }
        }
    }

    /**
     * Complete the sale
     */
    complete(invoiceNumber) {
        this.validate();

        if (this.invoiceType === InvoiceType.ESTIMATE) {
            this.status = SaleStatus.QUOTATION;
        } else {
            this.status = SaleStatus.COMPLETED;
        }

        if (invoiceNumber) {
            this.invoiceNumber = invoiceNumber instanceof InvoiceNumber
                ? invoiceNumber
                : new InvoiceNumber(invoiceNumber);
        }

        this.raiseEvent({
            type: 'SALE_COMPLETED',
            saleId: this.id,
            invoiceNumber: this.invoiceNumber?.toString(),
            total: this.total.toJSON(),
            timestamp: new Date()
        });
    }

    /**
     * Cancel the sale
     */
    cancel(reason) {
        if (this.status === SaleStatus.COMPLETED) {
            throw new Error('Cannot cancel completed sale. Use refund instead.');
        }

        this.status = SaleStatus.CANCELLED;

        this.raiseEvent({
            type: 'SALE_CANCELLED',
            saleId: this.id,
            reason,
            timestamp: new Date()
        });
    }

    /**
     * Process refund for completed sale
     */
    refund(items, reason) {
        if (this.status !== SaleStatus.COMPLETED) {
            throw new Error('Can only refund completed sales');
        }

        // Create refund sale (return invoice)
        // This would create a new Sale with InvoiceType.RETURN
        // For now, just mark as refunded
        this.status = SaleStatus.REFUNDED;

        this.raiseEvent({
            type: 'SALE_REFUNDED',
            saleId: this.id,
            refundedItems: items.map(i => i.id),
            reason,
            timestamp: new Date()
        });
    }

    // ========== Domain Events ==========

    raiseEvent(event) {
        this.domainEvents.push(event);
    }

    clearEvents() {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }

    getDomainEvents() {
        return [...this.domainEvents];
    }

    // ========== Data Mapping ==========

    /**
     * Convert to Prisma format for persistence
     */
    toPrisma() {
        return {
            id: this.id,
            invoiceNumber: this.invoiceNumber?.toPrisma(),
            status: this.status,
            invoiceType: this.invoiceType,
            storeId: this.storeId,
            customerId: this.customerId,
            patientId: this.patientId,
            prescriptionId: this.prescriptionId,
            subtotal: this.subtotal.toPrisma(),
            discount: this.discount.toPrisma(),
            tax: this.tax.toPrisma(),
            total: this.total.toPrisma(),
            roundingAdjustment: this.roundingAdjustment,
            createdBy: this.createdBy
        };
    }

    /**
     * Convert to DTO for API responses
     */
    toDTO() {
        return {
            id: this.id,
            invoiceNumber: this.invoiceNumber?.toString(),
            status: this.status,
            invoiceType: this.invoiceType,
            storeId: this.storeId,
            customerId: this.customerId,
            patientId: this.patientId,
            prescriptionId: this.prescriptionId,
            items: this.items.map(item => ({
                ...item,
                price: item.price.toJSON()
            })),
            payments: this.payments.map(p => ({
                ...p,
                amount: p.amount.toJSON()
            })),
            subtotal: this.subtotal.toJSON(),
            discount: this.discount.toJSON(),
            tax: this.tax.toJSON(),
            total: this.total.toJSON(),
            roundingAdjustment: this.roundingAdjustment,
            createdAt: this.createdAt.toISOString(),
            createdBy: this.createdBy
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = { Sale, SaleStatus, InvoiceType };
