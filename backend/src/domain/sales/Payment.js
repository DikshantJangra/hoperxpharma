/**
 * Payment Value Object
 * Represents a payment transaction for a sale
 */

const Money = require('../shared/valueObjects/Money');

const PaymentMethod = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI',
    CREDIT: 'CREDIT',
    ONLINE: 'ONLINE',
    INSURANCE: 'INSURANCE'
};

class Payment {
    constructor(data) {
        this.method = data.method;
        this.amount = data.amount instanceof Money
            ? data.amount
            : new Money(data.amount);

        this.reference = data.reference; // Transaction ID, card last 4, etc.
        this.timestamp = data.timestamp || new Date();

        // Additional metadata
        this.cardLastFour = data.cardLastFour;
        this.upiId = data.upiId;
        this.bankName = data.bankName;
    }

    static fromPrisma(prismaData) {
        return new Payment({
            method: prismaData.method,
            amount: prismaData.amount,
            reference: prismaData.reference,
            timestamp: prismaData.createdAt,
            cardLastFour: prismaData.cardLastFour,
            upiId: prismaData.upiId,
            bankName: prismaData.bankName
        });
    }

    /**
     * Create cash payment
     */
    static createCash(amount) {
        return new Payment({
            method: PaymentMethod.CASH,
            amount: new Money(amount)
        });
    }

    /**
     * Create card payment
     */
    static createCard(amount, reference, cardLastFour) {
        return new Payment({
            method: PaymentMethod.CARD,
            amount: new Money(amount),
            reference,
            cardLastFour
        });
    }

    /**
     * Create UPI payment
     */
    static createUPI(amount, reference, upiId) {
        return new Payment({
            method: PaymentMethod.UPI,
            amount: new Money(amount),
            reference,
            upiId
        });
    }

    // ========== Business Logic Methods ==========

    /**
     * Check if payment is digital
     */
    isDigital() {
        return [PaymentMethod.CARD, PaymentMethod.UPI, PaymentMethod.ONLINE].includes(this.method);
    }

    /**
     * Check if payment is credit
     */
    isCredit() {
        return this.method === PaymentMethod.CREDIT;
    }

    /**
     * Validate payment
     */
    validate() {
        if (!Object.values(PaymentMethod).includes(this.method)) {
            throw new Error(`Invalid payment method: ${this.method}`);
        }

        if (this.amount.getAmount() <= 0) {
            throw new Error('Payment amount must be positive');
        }

        // Digital payments must have reference
        if (this.isDigital() && !this.reference) {
            throw new Error(`${this.method} payment requires transaction reference`);
        }
    }

    /**
     * Get display text
     */
    getDisplayText() {
        const parts = [this.method];

        if (this.cardLastFour) {
            parts.push(`(*${this.cardLastFour})`);
        } else if (this.upiId) {
            parts.push(`(${this.upiId})`);
        } else if (this.reference) {
            parts.push(`(${this.reference.substring(0, 8)}...)`);
        }

        return parts.join(' ');
    }

    // ========== Data Mapping ==========

    toPrisma() {
        return {
            method: this.method,
            amount: this.amount.toPrisma(),
            reference: this.reference,
            cardLastFour: this.cardLastFour,
            upiId: this.upiId,
            bankName: this.bankName
        };
    }

    toDTO() {
        return {
            method: this.method,
            amount: this.amount.toJSON(),
            reference: this.reference,
            displayText: this.getDisplayText(),
            timestamp: this.timestamp.toISOString(),
            isDigital: this.isDigital(),
            isCredit: this.isCredit(),
            ...(this.cardLastFour && { cardLastFour: this.cardLastFour }),
            ...(this.upiId && { upiId: this.upiId }),
            ...(this.bankName && { bankName: this.bankName })
        };
    }

    toJSON() {
        return this.toDTO();
    }
}

module.exports = { Payment, PaymentMethod };
