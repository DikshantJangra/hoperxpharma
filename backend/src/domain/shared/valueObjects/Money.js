/**
 * Money Value Object
 * Encapsulates monetary amount with currency, preventing precision errors
 * and enforcing business rules around money calculations
 */

class Money {
    constructor(amount, currency = 'INR') {
        if (amount < 0) {
            throw new Error('Money amount cannot be negative');
        }

        // Always store with 2 decimal precision
        this.amount = parseFloat(amount.toFixed(2));
        this.currency = currency;
    }

    static zero(currency = 'INR') {
        return new Money(0, currency);
    }

    static fromPrisma(amount, currency = 'INR') {
        return new Money(amount, currency);
    }

    getAmount() {
        return this.amount;
    }

    getCurrency() {
        return this.currency;
    }

    add(other) {
        this.ensureSameCurrency(other);
        return new Money(this.amount + other.amount, this.currency);
    }

    subtract(other) {
        this.ensureSameCurrency(other);
        const result = this.amount - other.amount;
        if (result < 0) {
            throw new Error('Subtraction would result in negative money');
        }
        return new Money(result, this.currency);
    }

    multiply(factor) {
        if (factor < 0) {
            throw new Error('Cannot multiply money by negative factor');
        }
        return new Money(this.amount * factor, this.currency);
    }

    divide(divisor) {
        if (divisor <= 0) {
            throw new Error('Cannot divide money by zero or negative number');
        }
        return new Money(this.amount / divisor, this.currency);
    }

    applyPercentage(percentage) {
        return new Money((this.amount * percentage) / 100, this.currency);
    }

    applyDiscount(discountPercentage) {
        if (discountPercentage < 0 || discountPercentage > 100) {
            throw new Error('Discount percentage must be between 0 and 100');
        }
        const discountAmount = (this.amount * discountPercentage) / 100;
        return new Money(this.amount - discountAmount, this.currency);
    }

    equals(other) {
        if (!other) return false;
        return (
            this.currency === other.currency &&
            Math.abs(this.amount - other.amount) < 0.01 // Float comparison with tolerance
        );
    }

    isGreaterThan(other) {
        this.ensureSameCurrency(other);
        return this.amount > other.amount;
    }

    isGreaterThanOrEqual(other) {
        this.ensureSameCurrency(other);
        return this.amount >= other.amount;
    }

    isLessThan(other) {
        this.ensureSameCurrency(other);
        return this.amount < other.amount;
    }

    isZero() {
        return this.amount === 0;
    }

    ensureSameCurrency(other) {
        if (this.currency !== other.currency) {
            throw new Error(
                `Currency mismatch: Cannot operate on ${this.currency} and ${other.currency}`
            );
        }
    }

    // Serialization
    toJSON() {
        return {
            amount: this.amount,
            currency: this.currency
        };
    }

    toPrisma() {
        return this.amount;
    }

    toString() {
        return `${this.currency} ${this.amount.toFixed(2)}`;
    }
}

module.exports = Money;
